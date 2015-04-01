package si.lodrant.anagram_mk.servlet;

import java.net.URISyntaxException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Consumes;
import javax.ws.rs.CookieParam;
import javax.ws.rs.DELETE;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

@Path("/rest")
public class RestServicesMapper {
	@Context
	private UriInfo			uri;
	private String			rootPath	= "";
	private ImagesServices	is			= new ImagesServices(rootPath);
	private RestServices	rs			= new RestServices(rootPath);
	
	@POST
	@Path("/image/upload/handler")
	@Produces("text/plain; charset=UTF-8")
	public Response uploadImage(@Context HttpServletRequest req) throws URISyntaxException {
		return is.uploadImage(req);
	}

	@GET
	@Path("/author/{name}/image/array")
	@Produces("application/json; charset=UTF-8")
	public Response getImageUrls(@PathParam("name") String name) {
		return is.getImageUrls(name, uri);
	}

	@GET
	@Path("/author/{name}/image/{index}.jpg")
	@Produces("image/jpeg")
	public Response getImage(@PathParam("name") String name, @PathParam("index") int index, @Context HttpServletResponse res) {
		return is.getImage(name, index, res);
	}

	@GET
	@Path("/author/{name}/image/main.jpg")
	@Produces("image/jpeg")
	public Response getMainImage(@PathParam("name") String name, @Context HttpServletResponse res) {
		return is.getMainImage(name, res);
	}
	
	@DELETE
	@Path("/author/{name}/image/main.jpg")
	public Response deleteMainImage(@PathParam("name") String name) {
		return is.deleteMainImage(name);
	}

	@DELETE
	@Path("/author/{name}/image/{index}.jpg")
	public Response deleteImage(@PathParam("name") String name, @PathParam("index") int index) {
		return is.deleteImage(name, index);
	}

	@POST
	@Path("/author/{name}/image/{index}.jpg")
	public Response setAsMain(@PathParam("name") String name, @PathParam("index") int index) {
		return is.setAsMain(name, index);
	}

	@GET
	@Path("/image/upload/url")
	@Produces("text/plain; charset=UTF-8")
	public Response getUploadUrl() throws URISyntaxException {
		return is.getUploadUrl();
	}

	@PUT
	@Consumes("application/json")
	@Path("/author/{period}/{name}")
	public Response uploadAuthor(@PathParam("name") String name, @PathParam("period") String period, String json) {
		return rs.uploadAuthor(name, period, json);
	}

	@DELETE
	@Path("/author/{name}")
	public Response removeAuthor(@PathParam("name") String name) {
		return rs.removeAuthor(name);
	}

	@GET
	@Path("/author/{name}")
	@Produces("application/json; charset=UTF-8")
	public Response getAuthor(@PathParam("name") String name) {
		return rs.getAuthor(name);
	}

	@GET
	@Path("/authors/full")
	@Produces("application/json; charset=UTF-8")
	public Response getAuthorsFull() {
		return rs.getAuthorsFull();
	}
	
	@GET
	@Path("/authors/list")
	@Produces("application/json; charset=UTF-8")
	public Response getAuthorsList() {
		return rs.getAuthorsList();
	}


	@GET
	@Path("/author/random")
	@Produces("application/json; charset=UTF-8")
	public Response random(@CookieParam("ASESSIONKEY") long sessionid) {
		return rs.random(sessionid, uri);
	}
	
	@GET
	@Path("/period/{name}")
	@Produces("application/json; charset=UTF-8")
	public Response getPeriod(@PathParam("name") String name) {
		return rs.period(name);
	}
	
	@POST
	@Path("/register")
	public Response register(@CookieParam("ASESSIONKEY") long sessionid, @FormParam("username") String user) {
		return rs.register(sessionid, user, uri);
	}

	@POST
	@Path("/invalidate")
	@Produces("application/json; charset=UTF-8")
	public Response invalidate(@CookieParam("ASESSIONKEY") long sessionid) {
		return rs.invalidate(sessionid);
	}

	@POST
	@Path("/score")
	@Produces("text/plain")
	public Response commitScore(@CookieParam("ASESSIONKEY") long sessionid, @FormParam("points") int points,
								@FormParam("author") String author) {
		return rs.commitScore(sessionid, points, author, uri);
	}

	@GET
	@Path("/scores")
	@Produces("application/xml; charset=UTF-8")
	public Response getScores() {
		return rs.getScores();
	}

	@GET
	@Path("/validate")
	@Produces("text/plain; charset=UTF-8")
	public Response validate(@CookieParam("ASESSIONKEY") long sessionid) {
		return rs.validate(sessionid, uri);
	}
}
