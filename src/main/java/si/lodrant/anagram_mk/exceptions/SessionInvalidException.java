package si.lodrant.anagram_mk.exceptions;

import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Key;

public class SessionInvalidException extends Exception {

	/**
	 * 
	 */
	private static final long	serialVersionUID	= -7097352835002470130L;

	public SessionInvalidException(String message) {
		super(message);
	}

	public SessionInvalidException() {
		super("Session invalid");
	}

	public SessionInvalidException(String message, Key sessionKey) {
		super(message);
		DatastoreServiceFactory.getDatastoreService().delete(sessionKey);
	}
}
