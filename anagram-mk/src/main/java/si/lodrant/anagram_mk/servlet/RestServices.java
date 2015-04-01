package si.lodrant.anagram_mk.servlet;

import static si.lodrant.anagram_mk.OfyService.ofy;

import java.net.URI;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.logging.Logger;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.NewCookie;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;
import javax.xml.parsers.FactoryConfigurationError;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.TransformerException;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import si.lodrant.anagram_mk.AnagramFactory;
import si.lodrant.anagram_mk.exceptions.SessionException;
import si.lodrant.anagram_mk.exceptions.SessionInvalidException;
import si.lodrant.anagram_mk.jpa.Author;
import si.lodrant.anagram_mk.jpa.Score;
import si.lodrant.anagram_mk.jpa.Session;

import com.googlecode.objectify.NotFoundException;
import com.jamesmurty.utils.XMLBuilder;

public class RestServices {
	private static final Logger log = Logger.getLogger(RestServices.class.getName());
	private String rootPath;

	public RestServices(String rootParam) {
		rootPath = rootParam;
	}

	public Response uploadAuthor(String name, String period, String json) {
		Author author;

		try {
			author = ofy().load().type(Author.class).id(name).safe();
		} catch (NotFoundException e) {
			author = new Author(name);
		}

		author.setJson(json);
		author.setPeriod(period);
		ofy().save().entity(author).now();

		return Response.status(200).build();
	}

	public Response removeAuthor(String name) {
		ofy().delete().type(Author.class).id(name).now();

		return Response.status(200).build();
	}

	public Response getAuthor(String name) {
		try {
			String json = Author.load(name).getJson();
			return Response.status(200).entity(json).build();
		} catch (NotFoundException e) {
			throw new WebApplicationException(Response.status(404).entity(name).build());
		}
	}

	public Response getAuthorsFull() {
		List<Author> authors = ofy().load().type(Author.class).list();

		JSONParser parser = new JSONParser();
		JSONArray array = new JSONArray();

		for (Author e : authors) {
			try {
				array.add(parser.parse(e.getJson()));
			} catch (ParseException e1) {
				log.severe("Bad JSON data for author " + e.getName());
				throw new WebApplicationException(e1, 500);
			}
		}

		return Response.status(200).entity(array.toJSONString()).build();
	}

	public Response getAuthorsList() {
		List<Author> authors = ofy().load().type(Author.class).list();

		JSONArray array = new JSONArray();

		for (Author e : authors) {
			JSONObject object = new JSONObject();

			object.put("name", e.getName());
			object.put("period", e.getPeriod());
			array.add(object);
		}

		return Response.status(200).entity(array.toJSONString()).build();
	}

	public Response random(long sessionid, UriInfo uri) {
		AnagramFactory factory = AnagramFactory.getInstance();
		try {
			log.info(sessionid + "");
			Author random = factory.getNewAuthor(sessionid);
			return Response.status(200).entity(random.getJson()).build();
		} catch (SessionInvalidException e) {
			throw new SessionException(createURI("", uri), e.getMessage());
		}
	}

	public Response register(long sessionid, String user, UriInfo uri) {
		if (sessionid > 0) {
			ofy().delete().type(Session.class).id(sessionid).now();
		}

		if (user == null || user.isEmpty()) {
			return Response.status(400).build();
		}

		Session session = new Session(user);

		List<Author> authors = ofy().load().type(Author.class).list();
		List<String> available = new ArrayList<String>();

		for (Author author : authors) {
			available.add(author.getName());
		}

		session.setAvailableAuthors(available);

		ofy().save().entity(session).now();

		NewCookie cookie = new NewCookie("ASESSIONKEY", "" + session.getId(), "/", null, "Session cookie for Game of Anagrams", -1, false);

		return Response.seeOther(createURI("", uri)).cookie(cookie).build();
	}

	public Response invalidate(long sessionid) {
		ofy().delete().type(Session.class).id(sessionid).now();

		return Response.status(200).build();
	}

	public Response commitScore(long sessionid, int points, String author, UriInfo uri) {
		try {
			Session session = Session.load(sessionid);

			List<Integer> scores = session.getScores();

			scores.add(points);

			if (scores.size() == 4) {
				Score score = new Score(session.getUsername(), scores);

				ofy().save().entity(score);
				ofy().delete().entity(session);
			} else {
				session.setScores(scores);
				ofy().save().entity(session).now();
			}

			return Response.status(200).entity(scores.toString()).build();

		} catch (NotFoundException e1) {
			throw new SessionException(createURI("", uri), "Session not found.");
		}
	}

	public Response getScores() {
		try {
			SimpleDateFormat format = new SimpleDateFormat("yyyy/MM/dd 'ob' HH:mm:ss");

			XMLBuilder main = XMLBuilder.create("rows");
			List<Score> scores = ofy().load().type(Score.class).list();

			for (int i = 0; i < scores.size(); i++) {
				Score e = scores.get(i);
				List<Integer> score = e.getScores();
				int sum = 0;
				for (Integer a : score)
					sum += a.intValue();
				Date date = e.getDate();

				String name = e.getName();

				XMLBuilder row = main.e("row").a("id", "score" + i);
				row.e("cell").t(name + "");
				row.e("cell").t(sum + "");
				row.e("cell").t(format.format(date));
			}

			return Response.status(200).entity(main.asString()).build();
		} catch (ParserConfigurationException | FactoryConfigurationError | TransformerException e1) {
			throw new WebApplicationException(e1);
		}

	}

	public Response validate(long sessionid, UriInfo uri) {

		try {
			AnagramFactory.getInstance().validateSession(sessionid);
			return Response.status(200).build();
		} catch (NotFoundException e) {
			throw new SessionException(createURI("", uri), "Session not found.");
		} catch (SessionInvalidException e) {
			throw new SessionException(createURI("", uri), e.getMessage());
		}
	}

	private URI createURI(String path, UriInfo uri) {
		return uri.getAbsolutePathBuilder().replacePath(rootPath).path(path).build();
	}

	public Response period(String name) {
		List<Author> authors = ofy().load().type(Author.class).list();

		JSONParser parser = new JSONParser();
		JSONArray array = new JSONArray();

		for (Author e : authors) {
			if (e.getPeriod().equals(name)) {
				try {
					array.add(parser.parse(e.getJson()));
				} catch (ParseException e1) {
					log.severe("Bad JSON data for author " + e.getName());
					throw new WebApplicationException(e1, 500);
				}
			}
		}

		return Response.status(200).entity(array.toJSONString()).build();
	}
}