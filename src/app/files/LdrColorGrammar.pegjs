Colors
	= c:(ColorOrComment)* {
    	return c;
    }
    
ColorOrComment =
	c:Color / c:Comment {
		return { comment: c};
    }

Comment
	=  "0" c:CommentText EOL {
    	return c;
    }
    
CommentText
 	= [^\r^\n]* {
		return text();
    }
    
Color
	= "0" _ "!COLOUR" _ name:Name _ "CODE" _ code:Code _ "VALUE" _ value:Value _ "EDGE" _ edge:Value alpha:Alpha? luminance:Luminance? texture:Texture? EOL {
    	return {
        	...{
              name: name,
              code: code,
              value: value,
              edge: edge,
        	},
            	...alpha,
                ...luminance,
                ...texture
        };
    }

Alpha
	= _ "ALPHA" _ a:Integer {
    	return { alpha: a};
    }
    
Luminance
	= _ "LUMINANCE" _ l:Integer {
    	return { luminance: l };
    }

Texture
	= m:(Material / MaterialWithArgs) {
    	return m;
	}
    
Material
	= _ ("CHROME" / "PEARLESCENT" / "RUBBER" / "MATTE_METALLIC" / "METAL") {
		return { texture: text().trim()};
	}

MaterialWithArgs
	= _ "MATERIAL" _ a:Arg {
    	return { texture: "MATERIAL", args: a} 
    }
    
Arg
	= a:(Glitter / Speckle) {
    	return a;
    }

Speckle
	= "SPECKLE" _ "VALUE" _ value:Value _ "FRACTION" _ fraction:Float _ s:MinMaxSize {
		return {
        	...{
        		type: "SPECKLE",
            	value: value,
            	fraction: fraction,
            },...s
        }
	}

Glitter
	= "GLITTER" _ "VALUE" _ value:Value _ "FRACTION" _ fraction:Float _ "VFRACTION" _ vfraction:Float _ s:SizeOrMinMaxSize {
    	return {
        	...{
	        	type: "GLITTER",
    	        value: value,
        	    fraction: fraction,
            	vfraction: vfraction,
            },...s
        };
    }
    
SizeOrMinMaxSize
	= s:Size / s:MinMaxSize {
    	return s;
    }
    
Size
	= "SIZE" _ size:Integer {
    	return { size: size };
    }
    
MinMaxSize
	= "MINSIZE" _ minSize:Float _ "MAXSIZE" _ maxSize:Float {
    	return {
        	minSize: minSize,
            maxSize: maxSize
       	};
    }

Integer
	= [0-9]+ {
		return parseInt(text());
	}
    
Float
	= [-+]*[0-9]*[.]*[0-9]* {
    	return parseFloat(text());
    }

Value
	= "#" h:Hex {
    	return h;
    }
    
Hex
	= [0-9A-F]+ {
    	return parseInt(text(), 16);
    }

Code
	= [0-9]+ {
    	return parseInt(text());
	}

Name =
	[a-zA-Z0-9_]+ {
    	return text();
    }
_
	= [ \t]*
    
EOL
 = [ \t]*[\r\n]*[\n]*
    
    