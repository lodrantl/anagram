package si.lodrant.anagram_mk.jpa;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;

@Entity
public class Score {
	@Id
	Long id;
	String username;
	List<Integer> scores = new ArrayList<Integer>();
	Date date;

	public Score(String user, List<Integer> scores) {
		this.username = user;
		this.scores = scores;
		this.date = new Date();
	}

	public Score() {
	}

	public String getName() {
		return username;
	}

	public List<Integer> getScores() {
		return scores;
	}

	public Date getDate() {
		return this.date;
	}

}
