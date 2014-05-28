package si.lodrant.anagram_mk.jpa;

import com.google.appengine.api.blobstore.BlobKey;
import com.googlecode.objectify.annotation.Embed;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;

@Entity
@Embed
public class AuthorImage {
	@Id
	private String	imageKey;
	private String	painterName;

	public AuthorImage() {
	}

	public AuthorImage(BlobKey key, String painter) {
		this.imageKey = key.getKeyString();
		this.painterName = painter;
	}

	public BlobKey getImageKey() {
		return new BlobKey(imageKey);
	}

	public void setImageKey(String imageKey) {
		this.imageKey = imageKey;
	}

	public String getPainterName() {
		return painterName;
	}

	public void setPainterName(String painterName) {
		this.painterName = painterName;
	}
}
