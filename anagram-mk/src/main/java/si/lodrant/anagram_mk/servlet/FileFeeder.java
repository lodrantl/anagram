package si.lodrant.anagram_mk.servlet;

import java.io.InputStream;
import java.net.URI;
import java.util.logging.Logger;

import javax.activation.MimetypesFileTypeMap;
import javax.servlet.ServletContext;
import javax.ws.rs.CookieParam;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

import si.lodrant.anagram_mk.AnagramFactory;
import si.lodrant.anagram_mk.exceptions.SessionInvalidException;

import com.googlecode.objectify.NotFoundException;

@Path("")
public class FileFeeder {
	@Context
	private UriInfo uri;
	@Context
	private ServletContext context;
	private static final Logger log = Logger.getLogger(FileFeeder.class
			.getName());
	private String rootPath = "/WEB-INF/files";
	private final MimetypesFileTypeMap mtftp = new MyMimetypesFileTypeMap();

	@GET
	@Path("/")
	@Produces("text/html; charset=UTF-8")
	public Response frontPage(@CookieParam("ASESSIONKEY") long sessionid) {
		try {
			AnagramFactory.getInstance().validateSession(sessionid);
			InputStream site = context.getResourceAsStream(rootPath
					+ "/html/site1.html");
			return Response.ok(site).header("cdn", "worked").build();
		} catch (SessionInvalidException e) {
			return Response
					.ok(context.getResourceAsStream(rootPath
							+ "/html/index.html"))
					.header("error", e.getMessage()).build();
		} catch (NotFoundException e) {
			return Response
					.ok(context.getResourceAsStream(rootPath
							+ "/html/index.html"))
					.header("error", "Entity not found").build();
		}
	}

	@GET
	@Path("/{path}")
	@Produces("text/html; charset=UTF-8")
	public Response feedHTML(@PathParam("path") String path) {
		if (!path.endsWith(".html")) {
			path = path + ".html";
		}
		InputStream site = context.getResourceAsStream(rootPath + "/html/"
				+ path);
		if (site == null) {
			throw new WebApplicationException(Response.status(404)
					.entity("/html/" + path + " not found.").type("text/plain")
					.build());
		}
		return Response.ok(site).header("cdn", "worked at " + path).build();
	}

	@GET
	@Path("/js/{path:.+}")
	@Produces({ "text/javascript; charset=UTF-8", "image/*",
			"text/css; charset=UTF-8" })
	public Response feedJS(@PathParam("path") String path) {
		InputStream site = context
				.getResourceAsStream(rootPath + "/js/" + path);
		if (site == null) {
			throw new WebApplicationException(Response.status(404)
					.entity("/js/" + path + " not found.").type("text/plain")
					.build());
		}
		String mime = mtftp.getContentType(path);
		if (mime.equals("application/octet-stream")) {
			throw new WebApplicationException(Response.status(404)
					.entity("/js/" + path + " is of invalid type.")
					.type("text/plain").build());
		}
		return Response.ok(site, mime).header("cdn", "worked at " + path)
				.build();
	}

	@GET
	@Path("/css/{path:.+}")
	@Produces({ "text/css; charset=UTF-8", "image/*" })
	public Response feedCSS(@PathParam("path") String path) {

		InputStream site = context.getResourceAsStream(rootPath + "/css/"
				+ path);
		if (site == null) {
			throw new WebApplicationException(Response.status(404)
					.entity("/css/" + path + " not found.").type("text/plain")
					.build());
		}

		String mime = mtftp.getContentType(path);
		if (mime.equals("application/octet-stream")) {
			throw new WebApplicationException(Response.status(404)
					.entity("/css/" + path + " is of invalid type.")
					.type("text/plain").build());
		}
		return Response.ok(site, mime).header("cdn", "worked at " + path)
				.build();
	}

	@GET
	@Path("/img/{path:.+}")
	@Produces({ "image/*", "text/plain" })
	public Response feedIMG(@PathParam("path") String path) {
		InputStream site = context.getResourceAsStream(rootPath + "/img/"
				+ path);

		if (site == null) {
			throw new WebApplicationException(Response.status(404)
					.entity("/img/" + path + " not found.").type("text/plain")
					.build());
		}

		String mime = mtftp.getContentType(path);

		if (!mime.startsWith("image/")) {
			throw new WebApplicationException(Response.status(404)
					.entity("/img/" + path + " is not an image.")
					.type("text/plain").build());
		}

		return Response.ok(site, mime)
				.header("cdn", "worked at " + path + " with mime " + mime)
				.build();
	}

	public URI createURI(String path) {
		return uri.getAbsolutePathBuilder().replacePath(rootPath).path(path)
				.build();
	}

}