package si.lodrant.anagram_mk;

import si.lodrant.anagram_mk.jpa.Author;
import si.lodrant.anagram_mk.jpa.AuthorImage;
import si.lodrant.anagram_mk.jpa.Score;
import si.lodrant.anagram_mk.jpa.Session;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyFactory;
import com.googlecode.objectify.ObjectifyService;

public class OfyService {
	static {
		ObjectifyService.register(Author.class);
		ObjectifyService.register(AuthorImage.class);
		ObjectifyService.register(Session.class);
		ObjectifyService.register(Score.class);
	}

	public static Objectify ofy() {
		return ObjectifyService.ofy();
	}

	public static ObjectifyFactory factory() {
		return OfyService.factory();
	}
}