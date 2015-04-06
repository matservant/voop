
  
  var debug = false;
  var audio_context;
  var recorder;
  var samples = [];  
  var circles = [];  
  var speed = 5;  
  var halfCircle = 20;
  var canRec = true;
  var isRec = false;
  var controlsHeight = 80;
  var vSnap = false;
  var hSnap = false;
  var vPortions = 7;
  var hPortions = 7;    
  var vSpace, hSpace;               
  var tints = [
    0xFAD089,
    0xFF9C5B,
    0xF5634A,
    0xED303C,
    0xCFF09E,
    0xA8DBA8,
    0x79BD9A,
    0x0A486B,
    0x3B8183
  ];
  //start with a random tint
  var tintCount = Math.floor(Math.random()*tints.length);  
  var mouse = {x: 0, y: 0};
  var chromeMessage = '<div id="chrome-message">Voop runs only on Google Chrome at the moment, we are working on porting it in other browsers, if you want to contribute <a href="http://github.com/mat-lo/voop"> check the GitHub page</a></div>';

var slider = document.getElementById('timeSlider');

//chrome check
var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

if (isChrome) {
    //cool
    run();
  } else {
    document.body.innerHTML = chromeMessage;
  }

function run() {

slider.addEventListener('input', function()
{
    console.log('input changed to: ', slider.value);
    setSpeed(parseInt(slider.value));
});

document.addEventListener('mousemove', function(e){ 
    mouse.x = e.clientX || e.pageX; 
    mouse.y = e.clientY || e.pageY 
}, false);
  
  //right click event
  window.addEventListener('contextmenu', function(event) {
    if(isInCanvas(event.y)) {

      event.preventDefault();    
      for (var i=0; i < circles.length; i++) {
        var circle = circles[i];
        if(circle.isInside(event.x, event.y)) {

          if(debug) {
            console.log("duplicazzo!");
          }

          var au = document.createElement('audio');      	      
  	    au.controls = false;
      	au.src = samples[i].src;      	
        	samples.push(au);      
          
          var newCircle = createCircle(event.x, event.y, circle.tint);
          newCircle.isDuplicated = true;
          pushCircle(newCircle);
          break;
        }    
      }
    }
    
    return false;
}, false);

  //left pressed
  window.onmousedown = function(event) {   

          if(isInCanvas(event.y)) {
            isRec = false;

            //check that is not dragging a circle
            for (var i=0; i < circles.length; i++) {
              var circle = circles[i];
              if(circle.isInside(event.x, event.y)) {              
                canRec = false;   
                if(debug) { 
                  console.log("inside my body");
                }
              }
            }          

            if(canRec) {  
              //stop playback while recording
              for (var i=0; i < samples.length; i++) {    
                samples[i].pause();
                samples[i].currentTime = 0;
              }                
              isRec = true;    

              //200 is to avoid overlap of samples, as the stop is not immediate
              //setTimeout(function() {startRecording()}, 200);                          
              startRecording();

              //record                                          
              emptyDot.scale.x = 0.1;
              emptyDot.scale.y = 0.1;
              emptyDot.scaleDx = 0.5;
              emptyDot.scaleDy = 0.5;
              emptyDot.tint = tints[tintCount%tints.length];

              emptyDot.x = event.x;                          
              emptyDot.y = event.y;
              stage.addChild(emptyDot);
            }
            if(debug) {
              console.log("press");
            }
          }
  }

  //left released
  window.onmouseup = function(event) {
          
          if(isInCanvas(event.y)){
            if (isRec) {
              if(debug) {
                console.log("isrec: " + isRec);
              }
              stopRecording();
              stage.removeChild(emptyDot);
              var tint = tints[tintCount % tints.length];
              tintCount++;
              var circle = createCircle(event.x, event.y, tint);
              circle.bounce();
              pushCircle(circle);
            }
            
            for(var i=0; i < circles.length; i++) {
              circles[i].isDuplicated = false;
            }
            
            canRec = true;
            isRec = false;
            if(debug) {
              console.log("release");  
            }
          }        
  }

  //pixi
  var stage = new PIXI.Stage(0xFFFFFF);
  var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight - controlsHeight, null);
  var vSnappersContainer = new PIXI.DisplayObjectContainer();
  var hSnappersContainer = new PIXI.DisplayObjectContainer();
  var circlesContainer = new PIXI.DisplayObjectContainer();
  
  stage.addChild(hSnappersContainer)
  stage.addChild(vSnappersContainer);
  stage.addChild(circlesContainer);

  vSpace = renderer.height / vPortions;
  hSpace = renderer.width / hPortions;
  
  document.body.appendChild(renderer.view);


  requestAnimFrame( animate );


  //textures
  var circleTexture = PIXI.Texture.fromImage("i/dot.png");   
  var emptyTexture = PIXI.Texture.fromImage("i/emptyDot.png");     
  var hSnapperTxt = PIXI.Texture.fromImage("i/hSnapperTxt.png");   
  var vSnapperTxt = PIXI.Texture.fromImage("i/vSnapperTxt.png");   
  var timelineTxt = PIXI.Texture.fromImage("i/timeline.png");
  
  var timelineTop = new PIXI.Sprite(timelineTxt);
  var timelineBot = new PIXI.Sprite(timelineTxt);  
  var emptyDot = new PIXI.Sprite(emptyTexture);

  emptyDot.anchor.x = 0.5;
  emptyDot.anchor.y = 0.5;  
  
  timelineTop.anchor.x = 0.5;
  timelineTop.anchor.y = 0;

  timelineTop.position.x = 0;
  timelineTop.position.y = 0;  

  timelineBot.anchor.x = 0.5;
  timelineBot.anchor.y = 1;

  timelineBot.position.x = 0;
  timelineBot.position.y = renderer.height;  
  
  stage.addChild(timelineTop);
  stage.addChild(timelineBot);

  function animate() {
      requestAnimFrame( animate );   

      timelineTop.x += speed;
      timelineBot.x += speed;

      if(timelineTop.x > renderer.width) {
        timelineTop.x = 0;
        timelineBot.x = 0;
      }      

      emptyDot.scale.x += (emptyDot.scaleDx - emptyDot.scale.x) * 0.1;
      emptyDot.scale.y += (emptyDot.scaleDy - emptyDot.scale.y) * 0.1;      
      emptyDot.x = mouse.x;
      emptyDot.y = mouse.y;

      for (var i=0; i < circles.length; i++) {
        var circle = circles[i];      

        if(vSnap) {          
          circle.y = (Math.round(circle.y / vSpace) * vSpace);          
        }

        if(hSnap) {          
          circle.x = (Math.round(circle.x / hSpace) * hSpace);          
        }

        circle.scale.x += (circle.scaleDx - circle.scale.x) * 0.1;
        circle.scale.y += (circle.scaleDy - circle.scale.y) * 0.1;

        if(circle.scale.x > 0.58) {
          circle.deBounce();
        }
        
        if(circle.isDuplicated) {
          circle.position.x = mouse.x;
          circle.position.y = mouse.y;
          this.alpha = 0.5;
          this.dragging = true;
        }

        if(timelineTop.x < (circle.x + halfCircle) && timelineTop.x > (circle.x - halfCircle)) {
          if (isRec == false) {
            //below 0.5 or above 4 it stops working :(
            samples[i].playbackRate = 0.5 + (circle.y * 3.5) / renderer.height;        
            samples[i].play();
            circle.bounce();                                    
          }
        }
      }

      //stage.children.sort(depthCompare);
      renderer.render(stage);
  }


  //functions
  function createCircle(x, y, tint) {
    var circle = new PIXI.Sprite(circleTexture);    
    
    circle.anchor.x = 0.5;
    circle.anchor.y = 0.5;
    circle.position.x = x;
    circle.position.y = y;    

    circle.scale.x = 0.1;
    circle.scale.y = 0.1;    

    circle.scaleDx = 0.5;
    circle.scaleDy = 0.5;

    circle.interactive = true;
    circle.buttonMode = true;

    circle.tint = tint;
    
    circle.isDuplicated = false;
    
    circle.isInside = function(x, y) {
      var b = false;
      if (x < (circle.x + halfCircle) && x > (circle.x - halfCircle) && y < (circle.y + halfCircle) && y > (circle.y - halfCircle)) {
        b = true;
      }  
      return b;
    }

    circle.bounce = function() {
      this.scaleDx = 0.6;
      this.scaleDy = 0.6;      
    }    

    circle.deBounce = function() {
      this.scaleDx = 0.5;
      this.scaleDy = 0.5;      
    }    

    circle.mousedown = circle.touchstart = function(data)
    {
      this.data = data;
      this.alpha = 0.5;
      this.dragging = true;
    };

    circle.mouseup = circle.mouseupoutside = circle.touchend = circle.touchendoutside = function(data)
    {
      canRec = true;
      isRec = false;
      this.alpha = 1
      this.dragging = false;
      // set the interaction data to null
      this.data = null;
    };
        
    circle.mousemove = circle.touchmove = function(data)
    {
      if(this.dragging)
      {
        // need to get parent coords..
        var newPosition = this.data.getLocalPosition(this.parent);
        this.position.x = newPosition.x;
        this.position.y = newPosition.y;
      }
    }
    
    return circle;
  }
  
  function pushCircle(circle) {    
    circlesContainer.addChild(circle);
    circles.push(circle);
  }

  function aFreshStart() {
  	circlesContainer.removeChildren();	
  	samples.length = 0;
  	circles.length = 0;
  }

  function isInCanvas(y) {
    var b = false;
    if(y < window.innerHeight - controlsHeight) {
      b = true;
    }
    return b;
  }

  function setSpeed(val) {
    speed = val;
    console.log(speed);
  }

  function toggleVSnap() {
    vSnap = !vSnap;  
    document.getElementById('horizontal-snap').classList.toggle('untoggle');
    document.getElementById('horizontal-snap').classList.toggle('toggle');
    
    if(vSnap) {               
        for(var i=0; i<renderer.height; i+=vSpace) {
          var vSnapper = new PIXI.TilingSprite(vSnapperTxt, renderer.width, 1);
           vSnapper.anchor.x = 0;
           vSnapper.anchor.y = 0.5;
           vSnapper.position.x = 0;
           vSnapper.position.y = i;            
          vSnappersContainer.addChild(vSnapper);
        }
    } else {
      vSnappersContainer.removeChildren();
    }  
  }

  function toggleHSnap() {
    hSnap = !hSnap;
    document.getElementById('vertical-snap').classList.toggle('untoggle');
    document.getElementById('vertical-snap').classList.toggle('toggle');

    if(hSnap) {               
        for(var i=0; i<renderer.width; i+=hSpace) {
          var hSnapper = new PIXI.TilingSprite(hSnapperTxt, 1, renderer.height);
           hSnapper.anchor.x = 0.5;
           hSnapper.anchor.y = 0;
           hSnapper.position.x = i;
           hSnapper.position.y = 0;             
          hSnappersContainer.addChild(hSnapper);
        }
    } else {
      hSnappersContainer.removeChildren();
    }
  }  

  //audio
  function startUserMedia(stream) {
    var input = audio_context.createMediaStreamSource(stream);

    if (debug) {
      console.log('Media stream created.');
    }

    // Uncomment if you want the audio to feedback directly
    //input.connect(audio_context.destination);
    if (debug) {
      console.log('Input connected to audio context destination.');
    }

    recorder = new Recorder(input);

    if (debug) {
      console.log('Recorder initialised.');
    }
  }

  function startRecording() {    
    recorder && recorder.record();            
  }

  function stopRecording() {
    recorder && recorder.stop();        
    createDownloadLink();    
    recorder.clear();
  }


  function playBuffer() {
    recorder && recorder.getBuffer(function( buffers ) {
        var newSource = audio_context.createBufferSource();
        var newBuffer = audio_context.createBuffer( 2, buffers[0].length, audio_context.sampleRate );
        newBuffer.getChannelData(0).set(buffers[0]);
        newBuffer.getChannelData(1).set(buffers[1]);
        newSource.buffer = newBuffer;

        newSource.connect( audio_context.destination );
        newSource.start(0);        
      });
    }

  function createDownloadLink() {
    recorder && recorder.exportWAV(function(blob) {
      var url = URL.createObjectURL(blob);
      console.log(url);
      var li = document.createElement('li');
      var au = document.createElement('audio');
      var hf = document.createElement('a');
      
      au.controls = false;
      au.src = url;
      //au.play();
      samples.push(au);      
      //recordingslist.appendChild(li);
    });
  }

  window.onload = function init() {
    try {
      // webkit shim
      window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      window.URL = window.URL || window.webkitURL;
      
      audio_context = new AudioContext;      
      console.log('Audio context set up.');
      console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
      alert('No web audio support in this browser!');
    }
    
    navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
      console.log('No live audio input: ' + e);
    });
  };
}