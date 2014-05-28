package si.lodrant.anagram_mk.exceptions;

import java.net.URI;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class SessionException extends WebApplicationException {
	private static final long	serialVersionUID	= 6292219592050901108L;

	public SessionException() {
		super(Response.status(401).type(MediaType.TEXT_PLAIN).header("REDIRECT_LOC", "../").entity("Session invalid").build());
	}

	public SessionException(String message) {
		super(Response.status(401).type(MediaType.TEXT_PLAIN).header("REDIRECT_LOC", "../").entity(message).build());
	}

	public SessionException(URI location, String message) {
		super(Response.status(401).type(MediaType.TEXT_PLAIN).header("REDIRECT_LOC", location).entity(message).build());
	}
}
