package si.lodrant.anagram_mk.jpa;

import static si.lodrant.anagram_mk.OfyService.ofy;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import com.googlecode.objectify.NotFoundException;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;

@Entity
public class Session {
	@Id
	Long id;
	String username;
	List<String> availableAuthors = new ArrayList<String>();
	List<Integer> scores = new ArrayList<Integer>();
	Date date;

	public Session(String user) {
		username = user;
		date = new Date();
	}

	public Session() {
	}

	public List<String> getAvailableAuthors() {
		return availableAuthors;
	}

	public void setAvailableAuthors(List<String> availableAuthors) {
		this.availableAuthors = availableAuthors;
	}

	public Long getId() {
		return id;
	}

	public String getUsername() {
		return username;
	}

	public static Session load(Long id) throws NotFoundException {
		return ofy().load().type(Session.class).id(id).safe();
	}

	public List<Integer> getScores() {
		return scores;
	}

	public void setScores(List<Integer> scores) {
		this.scores = scores;
	}

	public Date getDate() {
		return date;
	}
}
