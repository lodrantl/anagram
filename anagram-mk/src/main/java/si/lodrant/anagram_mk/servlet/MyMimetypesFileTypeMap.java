package si.lodrant.anagram_mk.servlet;

import javax.activation.MimetypesFileTypeMap;

public class MyMimetypesFileTypeMap extends MimetypesFileTypeMap {
	public MyMimetypesFileTypeMap() {
		super();
		
		this.addMimeTypes("image/png png");
		this.addMimeTypes("image/x-icon ico");
		this.addMimeTypes("image/jpeg jpg jpeg");
		this.addMimeTypes("image/gif gif");
		this.addMimeTypes("image/bmp bmp");
		this.addMimeTypes("text/javascript js");
		this.addMimeTypes("text/css css");
		this.addMimeTypes("text/javascript map");
	}
}
