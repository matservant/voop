/*

	WHEN CLICKING RESET IT ALSO CREATES A NEW FUCKIN CIRCLE

*/


  var audio_context;
  var recorder;
  var samples = [];  
  var circles = [];  
  var speed = 5;  
  var halfCircle = 20;
  var canRec = true;
  var isRec = false;
  var controlsHeight = 80;
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
  var tintCount = 0;
  var mouse = {x: 0, y: 0};

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
          console.log("duplicazzo!");

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

  //left click
  window.onmousedown = function(event) {   

          if(isInCanvas(event.y)) {
            isRec = false;

            //check that is not dragging a circle
            for (var i=0; i < circles.length; i++) {
              var circle = circles[i];
              if(circle.isInside(event.x, event.y)) {              
                canRec = false;    
                console.log("inside my body");
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
            }

            console.log("press");
          }
  }

  //left released
  window.onmouseup = function(event) {
          
          if(isInCanvas(event.y)){
            if (isRec) {
              console.log("isrec: " + isRec);
              stopRecording();
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
            console.log("release");  
          }        
  }


  var stage = new PIXI.Stage(0xFFFFFF);
  var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight - controlsHeight, null);
  
  document.body.appendChild(renderer.view);

  requestAnimFrame( animate );

  var texture = PIXI.Texture.fromImage("dot.png");   

  var timelineTxt = PIXI.Texture.fromImage("timeline.png");
  var timelineTop = new PIXI.Sprite(timelineTxt);
  var timelineBot = new PIXI.Sprite(timelineTxt);
  
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

      for (var i=0; i < circles.length; i++) {
        var circle = circles[i];

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
            samples[i].play();
            circle.bounce();                                    
          }
        }
      }

      renderer.render(stage);
  }

  function createCircle(x, y, tint) {
    var circle = new PIXI.Sprite(texture);
    
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
    stage.addChild(circle);
    circles.push(circle);
  }

  function aFreshStart() {
  	for(var i=0; i<circles.length; i++) {
  		stage.removeChild(circles[i]);
  	}  	
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

  function startUserMedia(stream) {
    var input = audio_context.createMediaStreamSource(stream);
    console.log('Media stream created.');

    // Uncomment if you want the audio to feedback directly
    //input.connect(audio_context.destination);
    console.log('Input connected to audio context destination.');
    
    recorder = new Recorder(input);
    console.log('Recorder initialised.');
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
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
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