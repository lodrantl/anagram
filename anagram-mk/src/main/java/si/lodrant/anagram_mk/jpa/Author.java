package si.lodrant.anagram_mk.jpa;

import static si.lodrant.anagram_mk.OfyService.ofy;

import java.util.ArrayList;
import java.util.List;

import com.googlecode.objectify.NotFoundException;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;

@Entity
public class Author {
	@Id
	String				name;
	String				json;
	List<AuthorImage>	images	= new ArrayList<AuthorImage>();
	AuthorImage			mainImage;

	public Author() {
	}

	public Author(String name) {
		this.name = name;
	}

	public List<AuthorImage> getImages() {
		return images;
	}

	public boolean hasMainImage() {
		return this.mainImage != null;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getJson() {
		return json;
	}

	public void setJson(String json) {
		this.json = json;
	}

	public AuthorImage getMainImage() {
		return mainImage;
	}

	public void setMainImage(AuthorImage mainImage) {
		this.mainImage = mainImage;
	}

	public void setImages(List<AuthorImage> images) {
		this.images = images;
	}

	public void addImage(AuthorImage imageEntity) {
		images.add(imageEntity);
	}

	public void removeMainImage() {
		this.mainImage = null;
	}

	public void removeImage(int index) {
		if (images.size() > index)
			images.remove(index);
	}

	public AuthorImage getImage(int index) {
		if (images.size() > index) {
			return this.images.get(index);
		} else {
			return null;
		}
	}

	public static Author load(String name) throws NotFoundException {
		return ofy().load().type(Author.class).id(name).safe();
	}
}
