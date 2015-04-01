package si.lodrant.anagram_mk.servlet;

import static si.lodrant.anagram_mk.OfyService.ofy;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

import org.json.simple.JSONArray;

import si.lodrant.anagram_mk.jpa.Author;
import si.lodrant.anagram_mk.jpa.AuthorImage;

import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;
import com.googlecode.objectify.NotFoundException;

public class ImagesServices {
	private static final Logger	log			= Logger.getLogger(RestServices.class.getName());
	private BlobstoreService	blobstore	= BlobstoreServiceFactory.getBlobstoreService();
	private String				rootPath;

	public ImagesServices(String rootParam) {
		rootPath = rootParam;
	}

	public Response uploadImage(HttpServletRequest req) {
		Map<String, List<BlobKey>> blobs = blobstore.getUploads(req);
		List<BlobKey> blobKeys = blobs.get("authorimg");

		String name = (String) req.getParameter("name");
		String painter = (String) req.getParameter("painter");

		try {
			Author auth = ofy().load().type(Author.class).id(name).safe();

			for (BlobKey blob : blobKeys) {
				if (!auth.hasMainImage()) {
					auth.setMainImage(new AuthorImage(blob, painter));
				} else {
					auth.addImage(new AuthorImage(blob, painter));
				}
			}

			ofy().save().entity(auth).now();
		} catch (NotFoundException e) {
			throw new WebApplicationException(Response.status(404)
														.entity("Author " + name + " not found in the database.")
														.build());
		}
		return Response.ok().build();
	}

	public Response getImageUrls(String name, UriInfo uri) {
		try {
			List<AuthorImage> results = ofy().load().type(Author.class).id(name).safe().getImages();

			JSONArray ar = new JSONArray();

			for (int i = 0; i < results.size(); i++) {
				ar.add(createURI("/rest/author/" + name + "/image/" + i + ".jpg", uri).toString());
			}

			return Response.ok(ar.toJSONString()).build();

		} catch (NotFoundException e) {
			throw new WebApplicationException(Response.status(404)
														.entity("Author " + name + " not found in the database.")
														.build());
		}
	}

	public Response getImage(String name, int index, HttpServletResponse res) {
		try {
			List<AuthorImage> results = ofy().load().type(Author.class).id(name).safe().getImages();
			blobstore.serve(results.get(0).getImageKey(), res);
			return Response.ok(null).build();
		} catch (IOException | NotFoundException e) {
			throw new WebApplicationException(Response.status(404)
														.entity("Author " + name + " not found in the database.")
														.build());
		}
	}

	public Response getMainImage(String name, HttpServletResponse res) {
		try {
			Author auth = ofy().load().type(Author.class).id(name).safe();
			if (auth.hasMainImage()) {
				blobstore.serve(auth.getMainImage().getImageKey(), res);
				return Response.ok(null).build();
			} else {
				throw new WebApplicationException(Response.status(404).entity("Author has no main image.").build());
			}
		} catch (IOException | NotFoundException e) {
			throw new WebApplicationException(Response.status(404)
														.entity("Author " + name + " not found in the database.")
														.build());
		}
	}

	public Response deleteMainImage(String name) {
		try {
			Author auth = ofy().load().type(Author.class).id(name).safe();

			boolean modified = false;

			if (auth.hasMainImage()) {
				blobstore.delete(auth.getMainImage().getImageKey());
				auth.removeMainImage();
				modified = true;
			}
			List<AuthorImage> results = ofy().load().type(Author.class).id(name).safe().getImages();

			if (results.size() > 0) {
				auth.setMainImage(results.get(0));
				auth.removeImage(0);
				modified = true;
			}

			if (modified) {
				ofy().save().entity(auth).now();
			}
			
			return Response.ok().build();

		} catch (NotFoundException e) {
			throw new WebApplicationException(Response.status(404)
														.entity("Author " + name + " not found in the database.")
														.build());
		}
	}

	public Response deleteImage(String name, int index) {
		try {
			Author auth = ofy().load().type(Author.class).id(name).safe();

			blobstore.delete(auth.getImage(index).getImageKey());
			auth.removeImage(index);

			ofy().save().entity(auth).now();
			return Response.ok().build();
			
		} catch (NotFoundException e) {
			throw new WebApplicationException(Response.status(404)
														.entity("Author " + name + " not found in the database.")
														.build());
		}
	}

	public Response setAsMain(String name, int index) {
		try {
			Author auth = ofy().load().type(Author.class).id(name).safe();
			AuthorImage newImage = auth.getImage(index);
			if (newImage != null) {
				if (auth.hasMainImage()) {
					auth.addImage(auth.getMainImage());
				}

				auth.setMainImage(newImage);
				ofy().save().entity(auth).now();
			} else {
				throw new NotFoundException();
			}
			return Response.ok(null).build();
		} catch (NotFoundException e) {
			throw new WebApplicationException(Response.status(404).entity(name + " not found in datastore.").build());
		}
	}

	public Response getUploadUrl() throws URISyntaxException {
		return Response.created(new URI(blobstore.createUploadUrl("/rest/image/upload/handler"))).build();
	}

	private URI createURI(String path, UriInfo uri) {
		return uri.getAbsolutePathBuilder().replacePath(rootPath).path(path).build();
	}
}