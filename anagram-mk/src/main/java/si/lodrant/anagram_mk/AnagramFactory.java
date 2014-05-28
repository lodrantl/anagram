package si.lodrant.anagram_mk;

import static si.lodrant.anagram_mk.OfyService.ofy;

import java.util.Date;
import java.util.List;
import java.util.Random;
import java.util.logging.Logger;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;

import si.lodrant.anagram_mk.exceptions.SessionInvalidException;
import si.lodrant.anagram_mk.jpa.Author;
import si.lodrant.anagram_mk.jpa.Session;

import com.googlecode.objectify.NotFoundException;

public class AnagramFactory {

	private static AnagramFactory	instance		= null;
	private Random					randomGenerator	= new Random();
	private static final Logger		log				= Logger.getLogger(AnagramFactory.class.getName());

	public static AnagramFactory getInstance() {
		if (instance == null) {
			instance = new AnagramFactory();
		}
		return instance;
	}

	public Author getNewAuthor(long sessionkey) throws SessionInvalidException {
		try {
			Session session = Session.load(sessionkey);
			List<String> available = session.getAvailableAuthors();

			if (available == null) {
				throw new SessionInvalidException("Out of authors.");
			}

			while (available.size() > 0) {
				int randomI = randomGenerator.nextInt(available.size());
				String randomName = available.get(randomI);
				available.remove(randomI);

				session.setAvailableAuthors(available);
				ofy().save().entity(session).now();

				if (available.size() == 0) {
					ofy().delete().entity(session);
				}

				try {
					Author n = Author.load(randomName);
					return n;
				} catch (NotFoundException e) {
					ofy().delete().entity(session);
					throw new WebApplicationException(Response.status(500).entity("Bad JSON data").build());
				}
			}
			
			ofy().delete().entity(session);
			throw new SessionInvalidException("Out of valid authors.");
		} catch (NotFoundException e1) {
			throw new SessionInvalidException("Session not found.");
		}
	}
	
	public boolean validateSession(long sessionid) throws SessionInvalidException, NotFoundException {
		if (sessionid < 1) { 
			throw new SessionInvalidException("No session cookie, aborting.");
		}
		
		Session session = Session.load(sessionid);

		Date creationTime = session.getDate();
		List<Integer> score = session.getScores();
		List<String> available = session.getAvailableAuthors();

		if ((((new Date()).getTime() - creationTime.getTime()) / 3600000) <= 6) {
			if (score == null || score.size() <= 4) {
				if (available != null && available.size() > 0) {
					return true;
				} else {
					throw new SessionInvalidException("No more authors available");
				}
			} else {
				throw new SessionInvalidException("Game is already over.");
			}
		} else {
			throw new SessionInvalidException("Expired");
		}
	}
}
