MultiModels
	= models:SingleModel / models:(MultiModel)* {
    	return models;
    }

MultiModel
	= "0" _ "FILE" _ f:File EOL m:Model "0" _ "NOFILE" EOL {
    	return { ...{ file: f}, ... m };
    }

SingleModel
  = (!("0" _ "FILE")) m:Model {
  	return [ m ];
  }
  
Model
  = commands:(Command)* {
  	return { commands };
  }

Title
  = c:CommentText {
  	return c
  }
  
NewLine
	= "\n"

CarrageReturn
	= "\r"

Whitespace
	= Space / Tab

Space
	= " "

Tab
	= "\t"

Command
  = (!("0" _ "NOFILE")) [ \t]* c:(CommentCommand / PartLine / LineCommand / TriangleCommand / QuadCommand / OptionalLineCommand) (Whitespace / CarrageReturn / NewLine)* {
  	return c;
  }
  
CommentCommand
	= '0' c:(NormalComment / EmptyComment) {
    	return c;
    }
 
EmptyComment
	= EOL {
		return { ...{ lineType: 0} };
    }
 
NormalComment
	= _ x:CommentMeta EOL {
		return { ...{ lineType: 0}, ... x };
    }
    
PartLine
	= '1' _ x:Part TrailingComment* EOL {
	    return x;
   }

LineCommand
	= '2' _ x:Line TrailingComment* EOL {
	    return x;
   }

TriangleCommand
	= '3' _ x:Triangle TrailingComment* EOL {
	    return x;
   }

QuadCommand
	= '4' _ x:Quad TrailingComment* EOL {
    	return x;
    }
    
OptionalLineCommand
	= '5' _ x:OptionalLine TrailingComment* EOL {
    	return x;
    }

CommentMeta
  = n:SlashComment / n:Name / n:Author / n:Meta / n:Bfc / n:Step / n:Print / n:Write / n:Clear / n:Pause / n:Save / n:Comment {
  	return n;
  }

TrailingComment
	= "//".*

NoComment
	= '' {
    	return "";
    }
  
Name
  = "Name:" _ c:CommentText  {
  	return {
    	subType: "META",
    	metaName: "NAME",
        name: c
    };
  }

Author
  = "Author:" _ c:CommentText {
  	return {
    	subType: "META",
    	metaName: "AUTHOR",
    	author: c
    };
  }

SlashComment
  = ("--" / "//") _* c:CommentText {
  	return {
			subType: "COMMENT",
				hasSlashes: true,
        comment: c
    };
  }
  
Comment
  = c:CommentText {
  	return {
    	subType: "COMMENT",
				hasSlashes: false,
        comment: c
    };
  }
  
CommentText
 	= [^\r][^\n]* {
		return text();
  }

Meta
  = "!" n:MetaName c:CommentText {
  	return {
    	subType: "META",
        metaName: "!",
        value: n + c
    }
  }

MetaName
  = [A-Z_]+ {
  	return text();
  }
  
Bfc
  = "BFC" _ cert:(NoCertify / Certify / Clip / NoClip / CwClip / CcwClip / WindingDir / InvertNext) {
  	return {
    	subType: "META",
    	metaName: "BFC",
    	bfc: cert
    }
  }
  
CwClip
	= "CW" _ "CLIP" {
    	return {
        	subType: "CLIP",
        	clip: true,
          implied: false,
          dir: "CW"
        };
    }
    
CcwClip
	= "CCW" _ "CLIP" {
    	return {
        	subType: "CLIP",
        	clip: true,
          implied: false,
          dir: "CW"
        };
    }

InvertNext
	= "INVERTNEXT" {
    	return {
        	subType: "INVERTNEXT",
        	invertNext: true
        }
	}

NoClip
	= "NOCLIP" {
    	return {
        	subType: "CLIP",
            clip: false
        };
	}

Clip
	= "CLIP" c: (ClipDir / ClipNoDir) {
    	return c;
    }

ClipDir
	= _ dir:("CCW" / "CW") {
   	return {
    		subType: "CLIP",
    		clip: true,
        implied: false,
        dir: dir
      };
   }
   
ClipNoDir
	= "" {
    	return {
        	subType: "CLIP",
        	clip: true,
          implied: true,
          dir: "CCW"
      }
    }
    
WindingDir
	= dir:("CCW" / "CW") {
   	return {
    		subType: "CLIP",
    		clip: true,
        implied: false,
        dir: dir
      };
   }

Certify
   = "CERTIFY" c:(CertifyDir / CertifyNoDir) {
      return c;
   }
   
CertifyNoDir
	= "" {
    	return {
        	subType: "CERTIFY",
        	certfied: true,
          implied: true,
          dir: "CCW"
        };
    }
    
CertifyDir
	= _ dir:("CCW" / "CW") {
   	return {
    		subType: "CERTIFY",
    		certified: true,
        implied: false,
        dir: dir
      };
   }

NoCertify
	= "NOCERTIFY" {
    	return {
        	subType: "CERTIFY",
    			certified: false
        };
    }
    
Step
	= "STEP" {
    	return {
        	subType: "META",
    			metaName: "STEP"
        };
    }
        
Clear
	= "CLEAR" {
    	return {
        	subType: "META",
    			metaName: "CLEAR"
        };
    }
    
Pause
	= "PAUSE" {
    	return {
        	subType: "META",
    			metaName: "PAUSE"
        };
    }
        
Save
	= "SAVE" {
    	return {
        	subType: "META",
    			metaName: "SAVE"
        };
    }
    
Print
	= "PRINT" _ c:CommentText {
		return {
				subType: "META",
				metaName: "PRINT",
				print: c
			};
	}

Write
	= "WRITE" _ c:CommentText {
		return {
				subType: "META",
				metaName: "WRITE",
				write: c
			};
	}

Part
	= color:Color _ matrix:Matrix4 _ file:File EOL {
    	return {
        	lineType: 1,
            color: color,
            matrix: matrix,
            file: file
        }
    }
    
Line
	= color:Color _ a:Vector3 _ b:Vector3 EOL {
    	return {
        	lineType: 2,
            color: color,
            firstPoint: a,
            secondPoint: b
        }
    }
    
Triangle
	= color:Color _ a:Vector3 _ b:Vector3 _ c:Vector3 EOL {
    	return {
        	lineType: 3,
            color: color,
            firstPoint: a,
            secondPoint: b,
            thirdPoint: c
        }
    }
    
Quad
	= color:Color _ a:Vector3 _ b:Vector3 _ c:Vector3 _ d:Vector3 EOL {
    	return {
        	lineType: 4,
            color: color,
            firstPoint: a,
            secondPoint: b,
            thirdPoint: c,
            forthPoint: d
        }
    }
    
OptionalLine
	= color:Color _ a:Vector3 _ b:Vector3 _ c:Vector3 _ d:Vector3 EOL {
    	return {
        	lineType: 5,
            color: color,
            firstPoint: a,
            secondPoint: b,
            firstControlPoint: c,
            secondControlPoint: d
        }
    }
    
Matrix4
	= x:Float _ y:Float _ z:Float _ a:Float _ b:Float _ c:Float _ d:Float _ e:Float _ f:Float _ g:Float _ h:Float _ i:Float {
    	return new Matrix4().set(a, b, c, x, d, e, f, y, g, h, i, z, 0, 0, 0, 1);
//    	return [ a, b, c, x, d, e, f, y, g, h, i, z, 0, 0, 0, 1 ]
	}

Vector3
	= a:Float _ b:Float _ c:Float {
    	return new Vector3(a, b, c);
//    	return [ a, b, c ]
    }

Color
	= x:HexColor / x:IntColor {
    	return x
    }
    
IntColor
	= [0-9]+ {
		return { num: parseInt(text(), 10) }
	}

HexColor
	= '0x2'$(HexDigit HexDigit HexDigit HexDigit HexDigit HexDigit) {
    	return { direct: parseInt(text(), 16) }
}

HexDigit
	= [0-9A-F]

Float
    = ((Minus? Int? Frac? Exp?) / Int) {
		return parseFloat(text());
	}

DecimalPoint
    = "."

Digit1_9
    = [1-9]

e
    = [eE]

Exp
    = e (Minus / Plus)? Digit+

Frac
    = DecimalPoint Digit*

Int
    = Zero / (Digit1_9 Digit*)

Minus
    = "-"

Plus
    = "+"

Zero
    = "0"

Digit
	= [0-9]

File
	= [ 0-9a-zA-Z_.\\-]* {
    	return text().trim();
    }

EOL
 = [ \t]*[\r\n]*[\n]*

_ "whitespace"
  = [ \t]+
  
  