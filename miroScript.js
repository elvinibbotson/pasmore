// GLOBAL VARIABLES
var dbVersion=1;
var name=''; // drawing name
var size=4; // default drawing size: A4
var aspect=null;
var f=25.4/96; // scaling factor: mm/px at 96dpi
var gridSize=10; // default grid size is 10mm
var gridSnap=false; // grid snap off by default
var handleR=2; // 2mm handle radius
var boxR=5; // radius for corners of round-cornered boxes
var rad=0; // ditto for current box
var snapD=2; // 2mm snap distance
var snap=false; // flags if snapping to a node
var zoom=1; // start zoomed out to full drawing
var mode=null;
var scr={}; // screen size .w & .h and cursor coordinates .x & .y
var dwg={}; // drawing size .w & .h and offset .x & .y
var view={}; // viewBox for background and drawing
var copy={}; // x,y offsets, 'active' flag and IDs of elements copied
var x=0;
var y=0;
var x0=0;
var y0=0;
var dx=0;
var dy=0;
var w=0;
var h=0; 
var offset={'x':0,'y':0};
var arc={};
var selectionBox={}; // for box select
var selection=[]; // list of elements in selectionBox
var selectedPoints=[]; // list of selected points in line or shape
var db=null; // indexed database holding SVG elements
var nodes=[]; // array of nodes each with x,y coordinates and element ID
var dims=[]; // array of links between elements and dimensions
var element=null; // current element
// var elID=null; // id of current element
var memory=[]; // holds element states to allow undo
var node=0; // node number (0-9) within selected element
var blueline=null; // bluePolyline
var stamp=null; // current stamp
var stampID=null; // id of current stamp
var lineType='solid'; // default styles
var lineCol='#000000';
var lineW=0.25; // 0.25mm
var fillType='solid';
var fillCol='#cccccc';
var opacity=1;
var blur=0;
var textFont='sans';
var textSize=5; // default text size
var textStyle='fine'; // normal text
var currentDialog=null;
var image={}; // holds background image sizes
var ctx=null; // canvas context

class Point {
    constructor(x,y) {
        this.x=x;
        this.y=y;
    }
}

scr.w=screen.width;
scr.h=screen.height;
// alert('screen size '+scr.w+'x'+scr.h);
dwg.x=dwg.y=copy.x=copy.y=0;
copy.active=false;
console.log("screen size "+scr.w+"x"+scr.h);
id('canvas').width=scr.w;
id('canvas').height=scr.h;
ctx=id('canvas').getContext('2d');
name=window.localStorage.getItem('name');
size=window.localStorage.getItem('size');
aspect=window.localStorage.getItem('aspect');
id('drawingName').innerHTML=name;
id('drawingSize').innerHTML=size;
id('drawingAspect').innerHTML=aspect;
gridSize=window.localStorage.getItem('gridSize');
if(!gridSize) gridSize=10;
id('gridSize').value=gridSize;
gridSnap=window.localStorage.getItem('gridSnap');
console.log('recover gridSnap: '+gridSnap);
if(!gridSnap) gridSnap=0;
id('gridSnap').checked=(gridSnap>0)?true:false;
console.log('grid checked: '+id('gridSnap').checked);
id('zoom').innerHTML=zoom;
console.log('name: '+name+'; aspect: '+aspect+';grid: '+gridSize+' '+gridSnap);
if(!aspect) {
    aspect=(scr.w>scr.h)?'landscape':'portrait';
    id('drawingAspect').innerHTML=aspect;
    showDialog('newDrawingDialog',true);
}
else initialise();
// setTimeout(function(){id('prompt').style.display='none'},5000);
// disable annoying pop-up menu
document.addEventListener('contextmenu', event=>event.preventDefault());
// TOOLS
id('docButton').addEventListener('click',function() {
    console.log('show drawing dialog for '+name+' size: '+size+'; aspect: '+aspect+'; zoom: '+zoom);
    id('drawingName').innerHTML=name;
    var s='';
    switch(Number(size)) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
            s='A'+size;
            break;
        case 7:
            s='20cm square';
            break;
        case 8:
            s='21cm square';
            break;
        case 9:
            s='30cm square';
            break;
        case 10:
            s='15x10cm';
            break;
        case 11:
            s='18x13cm';
            break;
        case 12:
            s='20x150cm';
            break;
        case 13:
            s='25x20cm';
            break;
        case 14:
            s='30x25cm';
            break;
        case 15:
            s='40x30cm';
            break;
        case 16:
            s='50x40cm';
            break;
        case 17:
            s='70x50cm';
            break;
    }
    console.log('set size to '+s);
    id('drawingSize').innerHTML=s;
    id('drawingAspect').innerHTML=aspect;
    console.log('grid is '+gridSize+'mm snap is '+gridSnap);
    id('gridSize').value=gridSize;
    showDialog('docDialog',true);
});
id('gridSnap').addEventListener('change',function() {
   gridSnap=(id('gridSnap').checked)?1:0;
   window.localStorage.setItem('gridSnap',gridSnap);
   console.log('grid is '+gridSnap);
});
id('gridSize').addEventListener('change',function() {
    gridSize=parseInt(id('gridSize').value);
    window.localStorage.setItem('gridSize',gridSize);
    console.log('grid is '+gridSize);
});
id('helpButton').addEventListener('click',function() {
    window.open('Draft.pdf');
    cancel();
});
id('new').addEventListener('click',function() {
    alert('You may want to save your work before starting a new drawing');
    console.log("show newDrawingDialog - screen size: "+scr.w+'x'+scr.h);
    size=4;
    id('sizeSelect').value=size;
    aspect=(scr.w>scr.h)?'landscape':'portrait';
    id('drawingAspect').innerHTML=aspect;
    showDialog('newDrawingDialog',true);
});
id('createNewDrawing').addEventListener('click',function() {
    size=id('sizeSelect').value;
    console.log('create new drawing - aspect:'+aspect+' size:'+size);
    window.localStorage.setItem('aspect',aspect);
    window.localStorage.setItem('size',size);
    name='';
    window.localStorage.setItem('name',name);
    // elID=0;
    // CLEAR DRAWING IN HTML & DATABASE
    id('dwg').innerHTML=''; // clear drawing
    id('handles').innerHTML=''; // clear any edit handles
    // drawOrder();
    var request=db.transaction('graphs','readwrite').objectStore('graphs').clear(); // clear graphs database
	request.onsuccess=function(event) {
		console.log("database cleared");
	};
	request.onerror=function(event) {
		console.log("error clearing database");
	};
	// window.localStorage.setItem('order','');
    showDialog('newDrawingDialog',false);
    window.localStorage.setItem('name',name);
    initialise();
});
id('load').addEventListener('click',function() {
    id('replace').checked=true;
    showDialog('loadDialog',true); 
});
id('fileChooser').addEventListener('change',function() {
    var method='replace';
    if(id('backgnd').checked) method='background';
    else if(id('merge').checked) method='merge';
    else if(id('stamp').checked) method='stamp';
    console.log('load method: '+method);
    var file=id('fileChooser').files[0];
    console.log('load file '+file+' name: '+file.name+' path: '+file.webkitRelativePath);
    var loader=new FileReader();
    loader.addEventListener('load',function(evt) {
        var data=evt.target.result;
        // console.log("file "+file.name+" read: "+data);
        var transaction=db.transaction(['graphs','stamps'],'readwrite');
		var graphStore=transaction.objectStore('graphs');
		var stampStore=transaction.objectStore('stamps');
        if((method=='replace')||(method=='merge')) {
        	var json=JSON.parse(data);
			console.log("json: "+json);
			if(method=='replace') {
		    	name=file.name;
		    	var n=name.indexOf('.json');
		    	name=name.substr(0,n);
		    	window.localStorage.setItem('name',name);
		    	id('dwg').innerHTML=''; // clear drawing
            	id('handles').innerHTML=''; // clear any edit handles
		    	graphStore.clear();
		    	stampStore.clear();
		    	nodes=[];
		    	aspect=json.aspect;
		    	window.localStorage.setItem('aspect',aspect);
		    	size=json.size;
		    	window.localStorage.setItem('size',size);
		    	window.localStorage.setItem('background',null);
		    	console.log('load drawing - aspect:'+aspect+' size:'+size);
		    	initialise();
			}
			else if(method=='merge') {
		    	name='';
		    	window.localStorage.setItem('name','');
			}
			for(var i=0;i<json.graphs.length;i++) {
		        console.log('add graph '+json.graphs[i].type);
		        if(method=='ref') {
		            if(json.graphs[i].type=='dim') continue; // skip dimensions
		            json.graphs[i].stroke='blue'; // reference layer in blue...
		            json.graphs[i].fill='none'; // ...with no fill
		            console.log('graph '+i+' set as blue outline'); 
		        }
		        var request=graphStore.add(json.graphs[i]);
		    }
		    for(i=0;i<json.stamps.length;i++) {
		        console.log('add stamp '+json.stamps[i].name);
		        request=stampStore.add(json.stamps[i]);
		    }
        }
		else {
			var url=URL.createObjectURL(file);
			console.log('image name:'+file.name);
			if(method=='background') {
				console.log('add background image');
				var img=new Image();
				img.onload=function() {
					var ratioH=img.width/dwg.w;
					var ratioV=img.height/dwg.h;
					image.w=dwg.w;
					image.h=dwg.h;
					if(ratioH>ratioV) image.h=dwg.w*img.height/img.width; // fit image to paper width
					else image.w=dwg.h*img.width/img.height; // fit image to paper height
					canvas.width=image.pw=image.w/f;
					canvas.height=image.ph=image.h/f;
					console.log('image size: '+img.width+'x'+img.height+' change to '+image.pw+'x'+image.ph);
					ctx.drawImage(img,0,0,image.pw,image.ph);
					var html="<image x='0' y='0' width='"+image.w+"' height='"+image.h+"' xlink:href="+url+">";
					id('background').innerHTML+=html; // draw image in background SVG to fit paper size
				}
				img.src=url;
			}
			else { // load selected stamp
				console.log("add stamp "+file.name);
				var stamp={'name':file.name,'svg':data};
				var request=stampStore.add(stamp);
				request.onsuccess=function(e) {
			    	var n=request.result;
					console.log("stamp added to database: "+n);
				};
				request.onerror=function(e) {console.log("error adding stamps");};
			}
		}
		transaction.oncomplete=function() {
		    console.log('loaded');
            if(method!='stamp') load();
		}
    });
    loader.addEventListener('error',function(event) {
        console.log('load failed - '+event);
    });
    // loader.readAsText(file);
    if(method=='background') loader.readAsDataURL(file);
    else loader.readAsText(file);
    showDialog('loadDialog',false);
})
id('save').addEventListener('click',function() {
    name=window.localStorage.getItem('name');
    if(name) id('saveName').value=name;
    showDialog('saveDialog',true);
});
id('confirmSave').addEventListener('click',function() {
    name=id('saveName').value;
    if(!name) {
    	alert('enter a file name');
    	return;
    }
    console.log('save data to file: '+name);
    showDialog('saveDialog',false);
    var method='data';
    if(id('data').checked) {
    	fileName=name+".json";
    	window.localStorage.setItem('name',name);
    	var data={};
    	data.aspect=aspect;
    	data.size=size;
    	data.graphs=[];
    	data.stamps=[];
    	var transaction=db.transaction(['graphs','stamps']);
    	var request=transaction.objectStore('graphs').openCursor();
    	request.onsuccess=function(event) {
        	var cursor=event.target.result;
        	if(cursor) {
            	delete cursor.value.id;
            	data.graphs.push(cursor.value);
            	cursor.continue();
        	}
        	else {
            	console.log('save '+data.graphs.length+' graphs');
            	request=transaction.objectStore('stamps').openCursor();
            	request.onsuccess=function(event) {
                	cursor=event.target.result;
                	if(cursor) {  // SAVE WITHOUT id's ????
                    	console.log('stamp: '+cursor.value.name);
                    	delete cursor.value.id; // SHOULDN'T NEED THIS
                    	data.stamps.push(cursor.value);
                    	cursor.continue();
                	}
                	else {
                    	console.log('save '+data.stamps.length+' stamps');
                	}
            	}
        	}
    	}
    	transaction.oncomplete=function() {
        	console.log('ready to save drawing data to file');
        	var json=JSON.stringify(data);
        	download(json,fileName,'text/plain');
    	}
    }
    else if(id('print').checked) {
    	method='print';
    	fileName=name+'.svg';
    	var svg=id('drawing').innerHTML;
    	download(svg,fileName,'data:image/svg+xml');
    }
    else if(id('image').checked) {
    	method='image';
    	fileName=name+'.png';
    	var canvas=id('canvas');
    	var img=document.createElement('img'); // new Image();
    	document.body.appendChild(img);
    	var svg=id('svg').cloneNode(true); // copy svg
    	var s=image.pw/(image.w/f); // scale svg to match original image size
    	svg.setAttribute('transform','scale('+s+')');
    	var xml=(new XMLSerializer).serializeToString(svg);
    	img.onload=function() {
    		w=img.clientWidth;
    		h=img.clientHeight;
    		console.log('svg image.src: '+img.src+' and size: '+w+'x'+h);
			ctx.drawImage(img,0,0,w,h);
			var png_img=canvas.toDataURL("image/png");
			var a=document.createElement('a');
	   		a.download=fileName;
    		a.href=canvas.toDataURL('image/png');
    		document.body.appendChild(a);
			a.click();
   			document.body.removeChild(img);
   			alert('file '+fileName+" saved to downloads folder");
    	}
    	img.src='data:image/svg+xml,'+encodeURIComponent(xml);
    }
    console.log('SAVED - method: '+method);
});
id('zoomInButton').addEventListener('click',function() {
    prompt('ZOOM IN');
    zoom*=2;
    console.log('zoom in to '+zoom);
    view.w/=2; // WAS view.w=Math.round(dwg.w/zoom);
    view.h/=2; // WAS view.h=Math.round(dwg.h/zoom);
    view.box=view.x+' '+view.y+' '+view.w+' '+view.h;
    console.log('new viewBox: '+view.box);
    id('background').setAttribute('viewBox',view.box);
    id('svg').setAttribute('viewBox',view.box);
    snapD/=2; // avoid making snap too easy
    handleR/=2; // avoid oversizing edit handles
    id('zoom').innerHTML=zoom;
});
id('zoomOutButton').addEventListener('click',function() {
    prompt('ZOOM OUT');
    zoom/=2;
    console.log('zoom out to '+zoom);
    view.w*=2; // WAS =Math.round(dwg.w/zoom);
    view.h*=2; // WAS =Math.round(dwg.h/zoom);
    view.box=view.x+' '+view.y+' '+view.w+' '+view.h;
    console.log('new viewBox: '+view.box);
    id('background').setAttribute('viewBox',view.box);
    id('svg').setAttribute('viewBox',view.box);
    snapD*=2;
    handleR*=2;
    id('zoom').innerHTML=zoom;
});
id('extentsButton').addEventListener('click',function() {
    prompt('ZOOM ALL');
    reset();
});
id('panButton').addEventListener('click',function() {
    // console.log('pan mode');
    mode='pan';
    prompt('PAN');
});
console.log('zoom; '+zoom+' w: '+w+' h: '+h);
// DRAWING TOOLS
id('sketchButton').addEventListener('click',function() {
    mode='sketch';
    prompt('SKETCH: drag from start');
});
id('lineButton').addEventListener('click',function() {
    // id('tools').style.display='none';
    mode='line';
    prompt('LINE: drag from start');
});
id('boxButton').addEventListener('click',function() {
    mode='box';
    rad=0;
    prompt('BOX: drag corner to corner');
    // id('tools').style.display='none';
});
id('ovalButton').addEventListener('click',function() { // OVAL/CIRCLE
    mode='oval';
    prompt('OVAL: drag from centre');
    // id('tools').style.display='none';
})
id('arcButton').addEventListener('click', function() {
   mode='arc';
   prompt('ARC: drag from centre');
   // id('tools').style.display='none';
});
id('textButton').addEventListener('click',function() {
    mode='text';
    // id('tools').style.display='none';
    prompt('TEXT: tap at start');
});
id('text').addEventListener('change',function() {
    var text=event.target.value;
    if(element) { // change selected text
        element.innerHTML=text;
        updateGraph(element.id,['text',text]);
    }
    else {
        console.log('add text '+text);
        var graph={}
	    graph.type='text';
	    graph.text=text;
	    graph.x=x0;
        graph.y=y0;
        graph.spin=0;
        graph.flip=0;
        graph.textSize=textSize;
        graph.textStyle=textStyle;
	    graph.fill=lineCol;
	    graph.opacity=opacity;
	    addGraph(graph);
    }
    cancel();
});
id('stampButton').addEventListener('click',function() {
    // id('tools').style.display='none';
    showDialog('stampDialog',true);
});
id('stampList').addEventListener('change',function() {
    console.log('choose '+event.target.value);
    stampID=event.target.value;
    console.log('stamp '+stampID+' picked');
    mode='stamp';
    prompt('STAMP: tap to place');
    id('stampList').value=null; // clear selection for next time
    showDialog('stampDialog',false);
});
// EDIT TOOLS
id('addButton').addEventListener('click',function() { // add point after selected point in line/shape
    var t=type(element);
    if((t!='line')&&(t!='shape')) return; // can only add points to lines/shapes
    console.log('add point');
    prompt('ADD POINT: tap on previous point');
    mode='addPoint';
    // showDialog('pointDialog',false);
});
id('deleteButton').addEventListener('click',function() {
    var t=type(element);
    if((t=='line')||(t=='shape')) {
        var points=element.points;
        if(selectedPoints.length>0) {  // remove >1 selected points
            prompt('REMOVE selected points');
            var pts='';
            for(var i=0;i<points.length;i++) {
                if(selectedPoints.indexOf(i)>=0) continue;
                pts+=points.x+','+points.y+' ';
            }
            element.setAttribute('points',pts);
            updateGraph(element.id,['points',pts]);
            cancel();
        }
        else { // remove individual point
            var n=points.length;
            if(((t=='line')&&(n>2))||((t=='shape')&&(n>3))) { // if minimum number of nodes, just remove element
                prompt('REMOVE: tap circle) handle to remove element or a disc handle to remove a node');
                mode='removePoint'; // remove whole element or one point
                return;
            }
        }
    }
    prompt('REMOVE');
    // for(var i=0;i<selection.length;i++) console.log('delete '+selection[i]);
    // console.log('element is '+element.id);
    showDialog('removeDialog',true);
});
id('confirmRemove').addEventListener('click',function() { // complete deletion
    if(selection.length>0) {
        while(selection.length>0) remove(selection.pop());
    }
    else remove(element.id);
    element=null;
    id('handles').innerHTML=''; // remove edit handles...
    id('selection').innerHTML=''; // ...selection shading,...
    id('blueBox').setAttribute('width',0); // ...and text outline...
    id('blueBox').setAttribute('height',0);
    showDialog('removeDialog',false);
    cancel();
});
id('backButton').addEventListener('click',function() {
    var previousElement=element.previousSibling;
    if(previousElement===null) {
        prompt('already at back');
        return;
    }
    else prompt('PUSH BACK');
    var previousID=previousElement.getAttribute('id');
    id('dwg').insertBefore(element,previousElement); // move back in drawing...
    swopGraphs(previousID,element.id); // ...and in database
    // drawOrder(); // update drawing order
});
id('forwardButton').addEventListener('click',function() {
    var nextElement=element.nextSibling;
    if(nextElement===null) {
        prompt('already at front');
        return;
    }
    else prompt('PULL FORWARD');
    var nextID=nextElement.getAttribute('id');
    id('dwg').insertBefore(nextElement,element); // bring forward in drawing.
    swopGraphs(element.id,nextID); // ...and in database
    // drawOrder(); // update drawing order
});
id('spinButton').addEventListener('click',function() {
    id('spinAngle').value=0;
    showDialog('spinDialog',true);
});
id('confirmSpin').addEventListener('click',function() {
    var spin=Number(id('spinAngle').value);
    if(selection.length<1) selection.push(element.id);
    console.log('spin '+selection.length+' elements by '+spin+' degrees');
    re('member');
    var axis=null;
    if(selection.length>1) { // spin around mid-point of multiple elements
        var el=id(selection[0]);
        var box=getBounds(el);
        var minX=box.x;
        var maxX=box.x+box.width;
        var minY=box.y;
        var maxY=box.y+box.height;
        console.log('first box '+minX+'-'+maxX+'x'+minY+'-'+maxY);
        for(var i=1;i<selection.length;i++) {
            el=id(selection[i]);
            box=getBounds(el);
            if(box.x<minX) minX=box.x;
            if((box.x+box.width)>maxX) maxX=box.x+box.width;
            if(box.y<minY) minY=box.y;
            if((box.y+box.height)>maxY) maxY=box.y+box.height;
        }
        console.log('overall box '+minX+'-'+maxX+'x'+minY+'-'+maxY);
        axis={};
        axis.x=(minX+maxX)/2;
        axis.y=(minY+maxY)/2;
    }
    if(axis) console.log('axis: '+axis.x+','+axis.y); else console.log('no axis');
    while(selection.length>0) {
        element=id(selection.pop());
        // elID=element.id;
        console.log('spin '+type(element));
        var ox=0; // element origin
        var ox=0;
        switch(type(element)) { // elements spin around origin
            case 'line':
            case 'shape':
                ox=element.points[0].x;
                oy=element.points[0].y;
                break;
            case 'box':
                ox=parseInt(element.getAttribute('x'))+parseInt(element.getAttribute('width'))/2;
                oy=parseInt(element.getAttribute('y'))+parseInt(element.getAttribute('height'))/2;
                break;
            case 'text':
            case 'stamp':
                ox=parseInt(element.getAttribute('x'));
                oy=parseInt(element.getAttribute('y'));
                break;
            case 'oval':
            case 'arc':
                ox=parseInt(element.getAttribute('cx'));
                oy=parseInt(element.getAttribute('cy'));
        }
        var netSpin=parseInt(element.getAttribute('spin'));
        console.log('change spin from '+netSpin);
        netSpin+=spin;
        console.log('to '+netSpin);
        element.setAttribute('spin',netSpin);
        updateGraph(element.id,['spin',netSpin]);
        setTransform(element);
        refreshNodes(element); // if not already done after move() or setTransform()
    }
    showDialog('spinDialog',false);
    cancel();
});
id('flipButton').addEventListener('click',function() {
    // if(type(element)=='dim') return; // cannot flip dimensions
    // id('copyLabel').style.color=(anchor)?'white':'gray'; // REDO WITHOUT ANCHOR
    // id('copy').disabled=!anchor;
    console.log('show flip dialog');
    // id('copy').checked=false;
    showDialog('flipDialog',true);
});
id('flipOptions').addEventListener('click',function() {
    var opt=Math.floor((event.clientX-parseInt(id('flipDialog').offsetLeft)+5)/32);
    console.log('click on '+opt); // 0: horizontal; 1: vertical
    var axis={};
    var elNodes=null;
    var el=id(selection[0]);
    var box=getBounds(el);
    var minX=box.x;
    var maxX=box.x+box.width;
    var minY=box.y;
    var maxY=box.y+box.height;
    console.log('first box '+minX+'-'+maxX+'x'+minY+'-'+maxY);
    for(var i=1;i<selection.length;i++) {
        el=id(selection[i]);
        box=getBounds(el);
        if(box.x<minX) minX=box.x;
        if((box.x+box.width)>maxX) maxX=box.x+box.width;
        if(box.y<minY) minY=box.y;
        if((box.y+box.height)>maxY) maxY=box.y+box.height;
    }
    console.log('overall box '+minX+'-'+maxX+'x'+minY+'-'+maxY);
    // flip in-situ around mid-point
    // copy=false;
    axis.x=(minX+maxX)/2;
    axis.y=(minY+maxY)/2;
    console.log('axis: '+axis.x+','+axis.y);
    re('member');
    while(selection.length>0) { // for each selected item...
    	el=id(selection.shift());
        // elID=selection.shift();
        // el=id(elID);
        console.log('flip '+type(el)+' element '+el.id);
        switch (type(el)) {
            case 'line': // reverse x-coord of each point and each node
            case 'shape':
                var points=el.points;
                for(i=0;i<points.length;i++) {
                    if(opt<1) {
                        dx=points[i].x-axis.x;
                        points[i].x=axis.x-dx;
                    }
                    else {
                        dy=points[i].y-axis.y;
                        points[i].y=axis.y-dy;
                    }
                }
                console.log('pts: '+pts);
                updateGraph(element.id,['points',el.getAttribute('points')]);
                refreshNodes(el);
                break;
            case 'box':
                var spin=parseInt(el.getAttribute('spin'));
                if(spin!=0) {
                        spin*=-1;
                        el.setAttribute('spin',spin);
                        setTransform(el);
                        updateGraph(element.id['spin',spin]);
                    }
                break;
            case 'oval':
                var spin=parseInt(el.getAttribute('spin'));
                if(spin!=0) {
                        spin*=-1;
                        el.setAttribute('spin',spin);
                        setTransform(el);
                        updateGraph(element.id['spin',spin]);
                    }
                break;
            case 'arc':
                var d=el.getAttribute('d');
                getArc(d);
                if(opt<1) { // flip left-right
                        dx=arc.cx-axis.x;
                        arc.cx=axis.x-dx;
                        dx=arc.x1-axis.x;
                        arc.x1=axis.x-dx;
                        dx=arc.x2-axis.x;
                        arc.x2=axis.x-dx;
                    }
                else {
                        dy=arc.cy-axis.y;
                        arc.cy=axis.y-dy;
                        dy=arc.y1-axis.y;
                        arc.y1=axis.y-dy;
                        dy=arc.y2-axis.y;
                        arc.y2=axis.y-dy;
                    }
                arc.sweep=(arc.sweep<1)? 1:0;
                updateGraph(element.id,['cx',arc.cx,'x1',arc.x1,'x2',arc.x2,'sweep',arc.sweep]);
                d="M"+arc.cx+","+arc.cy+" M"+arc.x1+","+arc.y1+" A"+arc.r+","+arc.r+" 0 "+arc.major+","+arc.sweep+" "+arc.x2+","+arc.y2;
                element.setAttribute('d',d);
                refreshNodes(el);
                break;
            case 'text':
        		showDialog('textDialog',false);
                var flip=parseInt(el.getAttribute('flip'));
                if(opt<1) { // flip left-right
                        console.log('current flip: '+flip);
                        flip^=1; // toggle horizontal flip;
                        dx=parseInt(el.getAttribute('x'))-axis.x;
                        el.setAttribute('x',(axis.x-dx));
                    }
                else { // flip top-bottom
                        flip^=2; // toggle vertical flip
                        dy=parseInt(el.getAttribute('y'))-axis.y;
                        el.setAttribute('y',(axis.y-dy));
                    }
                el.setAttribute('flip',flip);
                setTransform(el);
                updateGraph(element.id,['flip',flip]);
                break;
            case 'stamp':
                var flip=parseInt(el.getAttribute('flip'));
                if(opt<1) { // flip left-right
                        console.log('current flip: '+flip);
                        flip^=1; // toggle horizontal flip;
                        dx=parseInt(el.getAttribute('ax'))-axis.x;
                        el.setAttribute('ax',(axis.x-dx));
                    }
                else { // flip top-bottom
                        flip^=2; // toggle vertical flip
                        dy=parseInt(el.getAttribute('ay'))-axis.y;
                        el.setAttribute('ay',(axis.y-dy));
                    }
                refreshNodes(el);
                w=parseInt(el.getAttribute('x'));
                h=parseInt(el.getAttribute('y'));
                var hor=flip&1;
                var ver=flip&2;
                var t='translate('+(hor*w)+','+(ver*h/2)+') ';
                t+='scale('+((hor>0)? -1:1)+','+((ver>0)? -1:1)+')';
                // ADD rotate() FOR SPIN
                el.setAttribute('flip',flip);
                el.setAttribute('transform',t);
                updateGraph(element.id,['flip',flip]);
                break;
        }
    }
    cancel();
    showDialog('flipDialog',false);
});
id('alignButton').addEventListener('click',function() {
    showDialog('alignDialog',true);
});
id('alignOptions').addEventListener('click',function() {
    x0=parseInt(id('alignDialog').offsetLeft)+parseInt(id('alignOptions').offsetLeft);
    y0=parseInt(id('alignDialog').offsetTop)+parseInt(id('alignOptions').offsetTop);
    console.log('alignOptions at '+x0+','+y0);
    x=Math.floor((event.clientX-x0+5)/32); // 0-2
    y=Math.floor((event.clientY-y0+5)/32); // 0 or 1
    console.log('x: '+x+' y: '+y);
    var opt=y*3+x; // 0-5
    console.log('option '+opt);
    var el=id(selection[0]);
    var box=getBounds(el);
    var minX=box.x;
    var maxX=box.x+box.width;
    var minY=box.y;
    var maxY=box.y+box.height;
    console.log('first box '+minX+'-'+maxX+'x'+minY+'-'+maxY);
    for(var i=1;i<selection.length;i++) {
        el=id(selection[i]);
        box=getBounds(el);
        if(box.x<minX) minX=box.x;
        if((box.x+box.width)>maxX) maxX=box.x+box.width;
        if(box.y<minY) minY=box.y;
        if((box.y+box.height)>maxY) maxY=box.y+box.height;
    }
    var midX=(minX+maxX)/2;
    var midY=(minY+maxY)/2;
    console.log('overall box '+minX+'-'+maxX+'x'+minY+'-'+maxY);
    re('member');
    for(i=0;i<selection.length;i++) {
        el=id(selection[i]);
        box=getBounds(el);
        console.log('move '+el.id+'?');
        switch(opt) {
            case 0: // align left
                if(box.x>minX) move(el,(minX-box.x),0);
                break;
            case 1: // align centre left-right
                x=Number(box.x)+Number(box.width)/2;
                if(x!=midX) move(el,(midX-x),0); 
                break;
            case 2: // align right
                x=Number(box.x)+Number(box.width);
                if(x<maxX) move(el,(maxX-x),0);
                break;
            case 3: // align top
                if(box.y>minY) move(el,0,(minY-box.y));
                break;
            case 4: // align centre top-bottom
                y=Number(box.y)+Number(box.height)/2;
                if(y!=midY) move(el,0,(midY-y));
                break;
            case 5: // align bottom
                console.log('align bottom');
                y=Number(box.y)+Number(box.height);
                if(y<maxY) move(el,0,(maxY-y));
        }
    }
    // CHECK NODES GET MOVED TOO!!!!! - USE refreshNodes(el)
    showDialog('alignDialog',false);
    cancel();
    // selection=[];
    // id('selection').innerHTML='';
});
id('copyButton').addEventListener('click',function() {
	copy.active=true; // copy is active
	copy.elements=[]; // build list of copy id's
	console.log('copy '+selection.length+' elements - offsets: '+copy.x+','+copy.y);
	if((copy.x==0)&&(copy.y==0)) prompt('COPY: drag to position');
	else prompt('COPY: tap or drag');
	for(var i=0;i<selection.length;i++) {
		element=id(selection[i]);
		var g={};
		g.type=type(element);
		if(g.type!='stamp') { // stamps don't have style
                g.stroke=element.getAttribute('stroke');
                g.lineW=element.getAttribute('stroke-width');
                g.lineStyle=getLineStyle(element);
                var val=element.getAttribute('fill');
                if(val.startsWith('url')) {
                	var p=id('pattern'+element.id);
                	g.fillType='pattern'+p.getAttribute('index');
                	g.fill=p.firstChild.getAttribute('fill');
                }
                else {
                	g.fillType=(val=='none')?'none':'solid';
                	g.fill=val;
                }
                console.log('copy fillType: '+g.fillType+'; fill: '+g.fill);
                var val=element.getAttribute('fill-opacity');
                if(val) g.opacity=val;
            }
            g.spin=element.getAttribute('spin');
            switch(g.type) {
            	case 'sketch':
            		console.log(element.points.length+' points to copy');
            		g.points=[]; // array of points
	        		for(var j=0;j<element.points.length;j++) g.points.push({x:element.points[j].x,y:element.points[j].y});
                    console.log('first point: '+g.points[0].x+','+g.points[0].y);
            		break;
                case 'line':
                    g.points='';
                    for(var p=0;p<element.points.length;p++) {
                        g.points+=element.points[p].x+copy.x+',';
                        g.points+=element.points[p].y+copy.y+' ';
                    }
                    break;
                case 'box':
                    g.x=Number(element.getAttribute('x'))+copy.x;
                    g.y=Number(element.getAttribute('y'))+copy.y;
                    g.width=Number(element.getAttribute('width'));
                    g.height=Number(element.getAttribute('height'));
                    g.radius=Number(element.getAttribute('rx'));
                    console.log('copy '+g.type+' at '+g.x+','+g.y);
                    break;
                case 'oval':
                    g.cx=Number(element.getAttribute('cx'))+copy.x;
                    g.cy=Number(element.getAttribute('cy'))+copy.y;
                    g.rx=Number(element.getAttribute('rx'));
                    g.ry=Number(element.getAttribute('ry'));
                    console.log('copy '+g.type+' at '+g.cx+','+g.cy);
                    break;
                case 'arc':
                    var d=element.getAttribute('d');
                    getArc(d);
                    g.cx=arc.cx+copy.x;
                    g.cy=arc.cy+copy.y;
                    g.x1=arc.x1+copy.x;
                    g.y1=arc.y1+copy.y;
                    g.x2=arc.x2+copy.x;
                    g.y2=arc.y2+copy.y;
                    g.r=arc.r;
                    g.major=arc.major;
                    g.sweep=arc.sweep;
                    console.log('copy '+g.type+' at '+g.cx+','+g.cy);
                    break;
                case 'text':
                    g.x=Number(element.getAttribute('x'))+copy.x;
                    g.y=Number(element.getAttribute('y'))+copy.y;
                    g.flip=Number(element.getAttribute('flip'));
                    g.text=element.innerHTML;
                    g.textSize=Number(element.getAttribute('font-size'));
                    var style=element.getAttribute('font-style');
                    g.textStyle=(style=='italic')?'italic':'fine';
                    if(element.getAttribute('font-weight')=='bold') g.textStyle='bold';
                    break;
                case 'stamp':
                    g.x=Number(element.getAttribute('x'))+copy.x;
                    g.y=Number(element.getAttribute('y'))+copy.y;
                    g.flip=Number(element.getAttribute('flip'));
                    g.name=element.getAttribute('href').substr(1); // strip off leading #
                    break;
            }
            addGraph(g);
	}
	mode='move';
});
id('filletButton').addEventListener('click',function() {
    if(type(element!='box')) return; // can only fillet box corners
    id('filletR').value=parseInt(element.getAttribute('rx'));
    showDialog('filletDialog',true);
});
id('confirmFillet').addEventListener('click',function() {
    re('member');
    var r=parseInt(id('filletR').value);
    element.setAttribute('rx',r);
    updateGraph(element.id,['radius',r]);
    showDialog('filletDialog',false);
    cancel();
});
id('defineButton').addEventListener('click',function() {
    id('stampName').value='';
    if(selection.length>1) showDialog('defineDialog',true);
});
id('confirmDefine').addEventListener('click',function() {
    var name=id('stampName').value;
    if(!name) {
        alert('Enter a name for the stamp');
        return;
    }
    // var ax=parseInt(id('anchor').getAttribute('cx'));
    // var ay=parseInt(id('anchor').getAttribute('cy'));
    var ax=0; // set anchor point as mid-point of selection
    var ay=0;
    var minX=0;
    var minY=0;
    var maxX=0;
    var maxY=0;
    for(var i=0;i<selection.length;i++) {
    	var box=getBounds(id(selection[i]));
    	if(i<1) { // first selected item
    		minX=box.x;
    		minY=box.y;
    		maxX=minX+box.width;
    		maxY=minY+box.height;
    	}
    	else { // subsequent items
    		if(box.x<minX) minX=box.x;
    		if(box.y<minY) minY=box.y;
    		if((box.x+box.width)>maxX) maxX=box.x+box.width;
    		if((box.y+box.height)>maxY) maxY=box.y+box.height;
    	}
    	console.log('after item '+i+' box is '+box.width+'x'+box.height);
    }
    ax=(minX+maxX)/2;
    ay=(minY+maxY)/2;
    var svg='';
    for(i=0;i<selection.length;i++) {
        el=id(selection[i]);
        var t=type(el);
        console.log('add '+t+' element?');
        if(t=='stamp') continue; // cannot nest stamps
        switch(type(el)) {
            case 'line':
                var points=el.points;
                var pts='';
                for(var j=0;j<points.length;j++) pts+=(points[i].x-ax)+','+(points[i].y-ay)+' ';
                svg+="<polyline points=\'"+pts+"\' spin=\'"+el.getAttribute('spin')+"\' ";
                break;
            case 'shape':
                var points=el.points;
                var pts='';
                for(var j=0;j<points.length;j++) pts+=(points[i].x-ax)+','+(points[i].y-ay)+' ';
                svg+="<polygon points=\'"+pts+"\' spin=\'"+el.getAttribute('spin')+"\' ";
                break;
            case 'box':
                svg+="<rect x=\'"+(parseInt(el.getAttribute('x'))-ax)+"\' y=\'"+(parseInt(el.getAttribute('y'))-ay)+"\' ";
                svg+="width=\'"+el.getAttribute('width')+"\' height=\'"+el.getAttribute('height')+"\' rx=\'"+el.getAttribute('rx')+"\' spin=\'"+el.getAttribute('spin')+"\' ";
                break;
            case 'oval':
                svg+="<ellipse cx=\'"+(parseInt(el.getAttribute('cx'))-ax)+"\' cy=\'"+(parseInt(el.getAttribute('cy'))-ay)+"\' ";
                svg+="rx=\'"+el.getAttribute('rx')+"\' ry=\'"+el.getAttribute('ry')+"\' spin=\'"+el.getAttribute('spin')+"\' ";
                break;
            case 'arc':
                var d=el.getAttribute('d');
                getArc(d);
                arc.cx-=ax;
                arc.cy-=ay;
                arc.x1-=ax;
                arc.y1-=ay;
                arc.x2-=ax;
                arc.y2-=ay;
                d='M'+arc.cx+','+arc.cy+' M'+arc.x1+','+arc.y1+' A'+arc.r+','+arc.r+' 0 '+arc.major+','+arc.sweep+' '+arc.x2+','+arc.y2;
                svg+="<path d=\'"+d+"\' spin=\'"+el.getAttribute('spin')+"\' ";
                break;
            case 'text':
                svg+="<text x=\'"+parseInt(el.getAttribute('x'))-ax+"\' y=\'"+parseInt(el.getAttribute('y'))-ay+"\' ";
                svg+="spin=\'"+el.getAttribute('spin')+"\' flip=\'"+el.getAttribute('flip')+"\' ";
                svg+="stroke=\'"+el.getAttribute('stroke')+"\' fill=\'"+el.getAttribute('fill')+"\' ";
                svg+="font-size=\'"+el.getAttribute('font-size')+"/' ";
                var val=el.getAttribute('font-style');
                if(val) svg+="font-style=\'"+val+"\' ";
                val=el.getAttribute('font-weight');
                if(val) svg+="font-weight=\'"+val+"\' ";
                svg+=">"+el.innerHTML+"</text>";
        }
        if(t!='text') { // set style and complete svg
            svg+="stroke=\'"+el.getAttribute('stroke')+"\' stroke-width=\'"+el.getAttribute('stroke-width')+"\' ";
            var val=el.getAttribute('stroke-dasharray');
            if(val) svg+="stroke-dasharray=\'"+val+"\' ";
            svg+="fill=\'"+el.getAttribute('fill')+"\' ";
            val=el.getAttribute('fill-opacity');
            if(val) svg+="fill-opacity=\'"+val+"\'";
            svg+="/>";
        }
        console.log('svg so far: '+svg);
    }
    console.log('stamp svg: '+svg);
	var stampStore=db.transaction(['stamps'],'readwrite').objectStore('stamps');
	var stamp={'name':name,'svg':svg};
	var request=stampStore.add(stamp);
	request.onsuccess=function(e) {
		var n=request.result;
		console.log("stamp added to database: "+n);
		var html="<g id='"+name+"'>"+svg+"</g>";
        id('stamps').innerHTML+=html; // copy stamp svg into <defs>...
		html="<option value="+name+">"+name+"</option>";
        id('stampList').innerHTML+=html; //...add stamp name to stampList
	};
	request.onerror=function(e) {console.log("error saving stamp");};
	showDialog('defineDialog',false);
});
// STYLES
id('line').addEventListener('click',function() {
	// setStyle();
    showDialog('stylesDialog',true);
});
id('lineType').addEventListener('change',function() {
    var type=event.target.value;
    console.log('line type: '+type);
    // TRY THIS:
    if(selection.length>0) {
    	for (var i=0;i<selection.length;i++) {
    		console.log('change line width for selected element '+i);
    		var el=id(selection[i]);
    		w=parseInt(el.getAttribute('stroke-width'));
    		var val=null;
        	switch(type) {
            	case 'none':
            	case 'solid':
                	// var val=null;
                	break;
            	case 'dashed':
                	val=(4*w)+' '+(4*w);
                	break;
            	case 'dotted':
                	val=w+' '+w;
        	}
        	console.log('set element '+el.id+' line style to '+type);
        	el.setAttribute('stroke-dasharray',val);
        	val=el.getAttribute('stroke');
        	el.setAttribute('stroke',(type=='none')?'none':val);
        	// el.setAttribute('stroke',(type=='none')?'none':lineCol);
        	updateGraph(el.id,['lineStyle',type]);
        	updateGraph(el.id,['stroke',(type=='none')?'none':lineCol]);
    	}
    }
    /*
    if(element) { // change selected element
        // element=id(elID);
        w=parseInt(element.getAttribute('stroke-width'));
        switch(type) {
            case 'none':
            case 'solid':
                var val=null;
                break;
            case 'dashed':
                val=(4*w)+' '+(4*w);
                break;
            case 'dotted':
                val=w+' '+w;
        }
        console.log('set element '+element.id+' line style to '+type);
        element.setAttribute('stroke-dasharray',val);
        element.setAttribute('stroke',(type=='none')?'none':lineCol);
        updateGraph(element.id,['lineStyle',type]);
        updateGraph(element.id,['stroke',(type=='none')?'none':lineCol]);
    }
    */
    else { // change default line type
        lineType=type;
    }
    id('line').style.borderBottomStyle=type;
});
id('lineWidth').addEventListener('change',function() {
    var val=event.target.value;
    // TRY THIS:
    if(selection.length>0) {
    	for(var i=0;i<selection.length;i++) {
    		var el=id(selection[i]);
    		var lw=val;
        	el.setAttribute('stroke-width',lw);
        	if(el.getAttribute('stroke-dasharray')) el.setAttribute('stroke-dasharray',lw+' '+lw);
        	updateGraph(el.id,['lineW',lw]);
    	}
    }
    /*
    if(element) { // change selected element
        // element=id(elID);
        var lw=val;
        element.setAttribute('stroke-width',lw);
        if(element.getAttribute('stroke-dasharray')) element.setAttribute('stroke-dasharray',lw+' '+lw);
        updateGraph(element.id,['lineW',lw]);
    }
    */
    else { // change default line width
        lineW=val;
        console.log('set default line width to '+val);
    }
    id('line').style.borderWidth=(lineW)+'px';
});
id('textFont').addEventListener('change',function() {
    var val=event.target.value;
    // TRY THIS:
    if(selection.length>0) {
    	for(var i=0;i<selection.length;i++) {
    		var el=id(selection[i]);
    		if(type(el)=='text') {
            	switch(val) {
                	case 'sans':
                    	el.setAttribute('font-family','Sans-serif');
                    	break;
                	case 'serif':
                    	el.setAttribute('font-family','Serif');
                    	break;
                	case 'italic':
                    	el.setAttribute('font-family','Monospaced');
                    	break;
                	case 'cursive':
                    	el.setAttribute('font-family','Cursive');
            	}
            	updateGraph(el.id,['textFont',val]);
        	}
    	}
    }
    /*
    if(element) { // change selected text element
        // element=id(elID);
        if(type(element)=='text') {
            switch(val) {
                case 'sans':
                    element.setAttribute('font-family','Sans-serif');
                    break;
                case 'serif':
                    element.setAttribute('font-family','Serif');
                    break;
                case 'italic':
                    element.setAttribute('font-family','Monospaced');
                    break;
                case 'cursive':
                    element.setAttribute('font-family','Cursive');
            }
            updateGraph(element.id,['textFont',val]);
        }
        else textFont=val;
    }
    */
    else textFont=val;
});
id('textSize').addEventListener('change',function() {
    var val=event.target.value;
    // TRY THIS:
    if(selection.length>0) {
    	for (var i=0;i<selection.length;i++) {
    		console.log('change text size for selected element '+i);
    		var el=id(selection[i]);
    		if(type(el)=='text') {
            	el.setAttribute('font-size',val);
            	updateGraph(el.id,['textSize',val]);
        	}
    	}
    }
    /*
    if(element) { // change selected text element
        // element=id(elID);
        if(type(element)=='text') {
            element.setAttribute('font-size',val);
            // console.log('set element '+element.id+' text size to '+val);
            updateGraph(element.id,['textSize',val]);
        }
    }
    */
    else { // change default line width
        textSize=val;
        id('text').style.fontSize=(val*2)+'pt';
    }
});
id('textStyle').addEventListener('change',function() {
    var val=event.target.value;
    // TRY THIS:
    if(selection.length>0) {
    	for (var i=0;i<selection.length;i++) {
    		console.log('change text style for selected element '+i);
    		var el=id(selection[i]);
    		if(type(el)=='text') {
            	switch(val) {
                	case 'fine':
                    	el.setAttribute('font-style','normal');
                    	el.setAttribute('font-weight','normal');
                    break;
            		case 'bold':
                    	el.setAttribute('font-style','normal');
                    	el.setAttribute('font-weight','bold');
                    break;
                	case 'italic':
                    	el.setAttribute('font-style','italic');
                    	el.setAttribute('font-weight','normal');
            	}
            	updateGraph(el.id,['textStyle',val]);
        	}
    	}
    }
    /*
    if(element) { // change selected text element
        // element=id(elID);
        if(type(element)=='text') {
            switch(val) {
                case 'fine':
                    element.setAttribute('font-style','normal');
                    element.setAttribute('font-weight','normal');
                    break;
                case 'bold':
                    element.setAttribute('font-style','normal');
                    element.setAttribute('font-weight','bold');
                    break;
                case 'italic':
                    element.setAttribute('font-style','italic');
                    element.setAttribute('font-weight','normal');
            }
            updateGraph(element.id,['textStyle',val]);
        }
    }
    */
    else { // change default line width
        textStyle=val;
    }
});
id('lineCol').addEventListener('change',function() {
    var val=id('lineCol').value;
    // TRY THIS:
    if(selection.length>0) {
    	for (var i=0;i<selection.length;i++) {
    		console.log('change stroke colour for selected element '+i);
    		var el=id(selection[i]);
    		if(type(el)=='text') {
    			el.setAttribute('fill',val);
    			updateGraph(el.id,['fill',val]);
    		}
    		else {
    			el.setAttribute('stroke',val);
    			updateGraph(el.id,['stroke',val]);
    		}
    	}
    }
    /*
    if(element) { // change selected element
        // element=id(elID);
        if(type(element)=='text') { // text is filled not stroked
        console.log('change text colour to '+val);
            element.setAttribute('fill',val);
            updateGraph(element.id,['fill',val]);
        }
        else {
            element.setAttribute('stroke',val);
            updateGraph(element.id,['stroke',val]);
        }
    }
    */
    else { // change default line shade
        lineCol=val;
    }
    id('line').style.borderColor=val;
    // id('line').style.backgroundColor=val;
    // ADD CODE
});
id('fillType').addEventListener('change',function() {
    var type=event.target.value;
    console.log('fill type: '+type);
    // TRY THIS:
    if(selection.length>0) {
    	var col=id('fillCol').value;
    	for (var i=0;i<selection.length;i++) {
    		console.log('change fill type for selected element '+i);
    		var el=id(selection[i]);
    		if(type=='pattern') {
    			showDialog('patternMenu',true);
    			return;
    		}
    		else {
    			var ptn=id('pettern'+el.id); // attempt removal of any associated pattern
    			// console.log('remove '+ptn);
    			if(ptn) ptn.remove();
	        	el.setAttribute('fill',(type=='none')?'none':col);
    		}
        	updateGraph(el.id,['fillType',type]);
    	}
    }
    /*
    if(element) { // change selected element
        // element=id(elID);
        var col=id('fillCol').value;
        console.log('set element '+element.id+' fill type to '+type);
        if(type=='pattern') {
    		showDialog('patternMenu',true);
    		return;
    	}
    	else {
    		var ptn=id('pettern'+element.id); // attempt removal of any associated pattern
    		// console.log('remove '+ptn);
    		if(ptn) ptn.remove();
	        element.setAttribute('fill',(type=='none')?'none':col);
    	}
        updateGraph(element.id,['fillType',type]);
    }
    */
    else { // change default fillType type
        fillType=type;
    }
    id('fill').style.background=(type=='none')?'none':fillCol;
});
id('fillCol').addEventListener('change',function() {
    var val=id('fillCol').value;
    // TRY THIS:
    if(selection.length>0) {
    	var col=id('fillCol').value;
    	for (var i=0;i<selection.length;i++) {
    		console.log('change fill colour for selected element '+i);
    		var el=id(selection[i]);
    		// console.log('element '+i+' is '+type(el));
    		if(type(el)=='text') continue; // text fill colour uses line colour
    		var fill=id('fillType').value;
        	if(fill=='pattern') id('pattern'+element.id).firstChild.setAttribute('fill',val);
        	else el.setAttribute('fill',(fill=='solid')?val:'none');
        	updateGraph(el.id,['fill',val]);
    	}
    }
    /*
    if(element) { // change selected element
        // element=id(elID);
        // var fillCol=val;
        var type=id('fillType').value;
        if(type=='pattern') id('pattern'+element.id).firstChild.setAttribute('fill',val);
        else element.setAttribute('fill',(type=='solid')?val:'none');
        updateGraph(element.id,['fill',val]);
    }
    */
    else { // change default fill colour
        fillCol=val;
    }
    id('fillCol').value=val;
});
id('opacity').addEventListener('change',function() {
    var val=event.target.value;
    console.log('opacity: '+val);
    // TRY THIS:
    if(selection.length>0) {
    	var col=id('fillCol').value;
    	for (var i=0;i<selection.length;i++) {
    		console.log('change fill colour for selected element '+i);
    		var el=id(selection[i]);
    		el.setAttribute('stroke-opacity',val);
        	el.setAttribute('fill-opacity',val);
        	updateGraph(el.id,['opacity',val]);
    	}
    }
    /*
    if(element) { // change selected element
        // element=id(elID);
        element.setAttribute('stroke-opacity',val);
        element.setAttribute('fill-opacity',val);
        updateGraph(element.id,['opacity',val]);
    }
    */
    else opacity=val; // change default opacity
    id('fill').style.opacity=val;
});
id('blur').addEventListener('change',function() {
    var val=event.target.value;
    console.log('blur: '+val);
    // TRY THIS:
    if(selection.length>0) {
    	var col=id('fillCol').value;
    	for (var i=0;i<selection.length;i++) {
    		console.log('change blur for selected element '+i);
    		var el=id(selection[i]);
    		if(val>0) el.setAttribute('filter','url(#blur'+val+')');
        	else el.setAttribute('filter','none');
        	updateGraph(el.id,['blur',val]);
    	}
    }
    else blur=val; // change default blur
    // id('fill').style.opacity=val;
});
id('patternOption').addEventListener('click',function() {
	console.log('click "pattern" - fill is '+element.getAttribute('fill'));
	if(element && element.getAttribute('fill').startsWith('url')) showDialog('patternMenu',true);
});
id('patternMenu').addEventListener('click',function(event) {
	x=Math.floor((event.clientX-56)/32);
	y=Math.floor((event.clientY-12)/32);
	var n=y*6+x;
	var fill=element.getAttribute('fill');
	console.log('set element fill (currently '+fill+') to pattern'+n);
	var html="<pattern id='pattern"+element.id+"' index='"+n+"' width='"+pattern[n].width+"' height='"+pattern[n].height+"' patternUnits='userSpaceOnUse'";
	if(pattern[n].spin>0) html+=" patternTransform='rotate("+pattern[n].spin+")'";
	html+='>'+pattern[n].svg+'</pattern>';
	console.log('pattern HTML: '+html);
	id('defs').innerHTML+=html;
	var el=id('pattern'+element.id);
	// console.log('pattern code '+el.innerHTML);
	id('pattern'+element.id).firstChild.setAttribute('fill',fill);
	id('pattern'+element.id).lastChild.setAttribute('fill',fill);
	element.setAttribute('fill','url(#pattern'+element.id+')');
	 updateGraph(element.id,['fillType','pattern'+n]);
	// element.setAttribute('fill','url(#pattern'+y+x+')');
	// updateGraph(element.id,['fillType','pattern','fill','url(#pattern'+y+x+')'])
});
// POINTER DOWN
id('drawing').addEventListener('pointerdown',function() {
    console.log('pointer down - mode is '+mode);
    re('wind'); // WAS id('undoButton').style.display='none';
    event.preventDefault();
    if(currentDialog) showDialog(currentDialog,false); // clicking drawing removes any dialogs/menus
    scr.x=Math.round(event.clientX);
    scr.y=Math.round(event.clientY);
    x=x0=Math.round(scr.x*f/zoom+dwg.x);
    y=y0=Math.round(scr.y*f/zoom+dwg.y);
    // report('pointer down - screen: '+scr.x+','+scr.y+' drawing: '+x+','+y);
    var val=event.target.id;
    console.log('tap on '+val+' x,y:'+x+','+y+' x0,y0: '+x0+','+y0);
    var holder=event.target.parentNode.id;
    // console.log('holder is '+holder);
    if(holder=='selection') { // click on a blue box to move multiple selectin
        console.log('move group selection');
        mode='move';
        prompt('drag to MOVE selection');
        re('member');
    }
    else if(holder=='handles') { // handle
        console.log('HANDLE '+val);
        var handle=id(val);
        var bounds=getBounds(element);
        console.log('bounds: '+bounds.x+','+bounds.y+' '+bounds.width+'x'+bounds.height);
        id('blueBox').setAttribute('x',bounds.x);
        id('blueBox').setAttribute('y',bounds.y);
        id('blueBox').setAttribute('width',bounds.width);
        id('blueBox').setAttribute('height',bounds.height);
        id('guides').style.display='block';
        re('member');
        if(val.startsWith('mover')) {
            node=parseInt(val.substr(5)); // COULD GO AT START OF HANDLES SECTION
            if(mode=='addPoint') { // add point after start-point
                var points=element.points;
                x=Math.round((Number(points[0].x)+Number(points[1].x))/2);
                y=Math.round((Number(points[0].y)+Number(points[1].y))/2);
                var pts=points[0].x+','+points[0].y+' '+x+','+y+' ';
                for(var i=1;i<points.length;i++) pts+=points[i].x+','+points[i].y+' ';
                element.setAttribute('points',pts);
                updateGraph(element.id,['points',pts]);
                refreshNodes(element);
                cancel();
                return;
            }
            else if(mode=='removePoint') {
                showDialog('removeDialog',true);
                return;
            }
            console.log('move using node '+node);
            mode='move';
            prompt('drag to MOVE');
            switch(type(element)) {
                case 'sketch':
                    x0=handle.getAttribute('x');
                    y0=handle.getAttribute('y');
                    console.log('handle at '+x0+','+y0);
                    offset.x=offset.y=0; // assume this is start node
                    break;
                case 'line':
                case 'shape':
                    x0=element.points[0].x;
                    y0=element.points[0].y;
                    offset.x=element.points[0].x-element.points[node].x;
                    offset.y=element.points[0].y-element.points[node].y;
                    break;
                case 'box':
                    x0=element.getAttribute('x');
                    y0=element.getAttribute('y');
                    if(node<1) {
                        offset.x=-w/2;
                        offset.y=-h/2;
                    }
                    else {
                        offset.x=(node%2<1)?-w:0;
                        offset.y=(node>2)?-h:0;
                    }
                    break;
                case 'oval':
                    x0=element.getAttribute('cx');
                    y0=element.getAttribute('cy');
                    if(node<1) {
                        offset.x=-w/2;
                        offset.y=-h/2;
                    }
                    else {
                        offset.x=(node%2<1)?-w:0;
                        offset.y=(node>2)?-h:0;
                    }
                    break;
                case 'arc':
                    var d=element.getAttribute('d');
                    getArc(d);
                    x0=arc.cx;
                    y0=arc.cy;
                    switch(node) {
                        case 0:
                            offset.x=bounds.x-x0;
                            offset.y=bounds.y-y0;
                            break;
                        case 1:
                            offset.x=bounds.x-arc.x1;
                            offset.y=bounds.y-arc.y1;
                            break;
                        case 2:
                            offset.x=bounds.x-arc.x2;
                            offset.y=bounds.y-arc.y2;
                    }
                    break;
                case 'text':
                    x0=element.getAttribute('x');
                    y0=element.getAttribute('y');
                    var bounds=element.getBBox();
                    offset.x=0;
                    offset.y=-bounds.height;
                    break;
                case 'stamp':
                    x0=element.getAttribute('x');
                    y0=element.getAttribute('y');
            }
            console.log('offsets: '+offset.x+','+offset.y);
            id('blueBox').setAttribute('x',x+offset.x);
            id('blueBox').setAttribute('y',y+offset.y);
            id('guides').style.display='block';
            id('drawing').addEventListener('pointermove',drag);
            return;
        }
        else if(val.startsWith('sizer')) {
            node=parseInt(val.substr(5)); // COULD GO AT START OF HANDLES SECTION?
            if(mode=='addPoint') {
                console.log('add point after point '+node);
                var points=element.points;
                console.log('point '+node+': '+points[node].x+','+points[node].y);
                var n=points.length-1;
                var pts='';
                if(node==n) { // append point after end-point
                    dx=points[n].x-points[n-1].x;
                    dy=points[n].y-points[n-1].y;
                    x=points[n].x+dx;
                    y=points[n].y+dy;
                    for(var i=0;i<points.length;i++) {
                        pts+=points[i].x+','+points[i].y+' ';
                    }
                    pts+=x+','+y;
                }
                else { // insert point midway between selected point and next point
                    console.log('add between points '+node+'('+points[node].x+','+points[node].y+') and '+(node+1));
                    x=Math.round((points[node].x+points[node+1].x)/2);
                    y=Math.round((points[node].y+points[node+1].y)/2);
                    var i=0;
                    while(i<points.length) {
                        if(i==node) pts+=points[ i].x+','+points[i].y+' '+x+','+y+' ';
                        else pts+=points[i].x+','+points[i].y+' ';
                        console.log('i: '+i+' pts: '+pts);
                        i++;
                    }
                }
                element.setAttribute('points',pts);
                updateGraph(element.id,['points',pts]);
                refreshNodes(element);
                cancel();
                return;
            }
            else if(mode=='removePoint') {
                console.log('remove point '+node);
                var points=element.points;
                console.log('point '+node+': '+points[node].x+','+points[node].y);
                var pts='';
                for(var i=0;i<points.length-1;i++) {
                    if(i<node) pts+=points[i].x+','+points[i].y+' ';
                    else pts+=points[i+1].x+','+points[i+1].y+' ';
                }
                element.setAttribute('points',pts);
                updateGraph(element.id,['points',pts]);
                refreshNodes(element);
                cancel();
                return;
            }
            else prompt('drag to SIZE');
            console.log('size using node '+node);
            dx=dy=0;
            switch(type(element)) {
                case 'sketch':
                    mode='movePoint'+node;
                    id('blueBox').setAttribute('width',0);
                    id('blueBox').setAttribute('height',0);
                    break;
                case 'line':
                case 'shape':
                    mode='movePoint'+node;
                    var points=element.getAttribute('points');
                    id('bluePolyline').setAttribute('points',points);
                    id('blueBox').setAttribute('width',0);
                    id('blueBox').setAttribute('height',0);
                    id('guides').style.display='block';
                    break;
                case 'box':
                    mode='boxSize';
                    // dx=dy=0; // MOVE FOR GENERAL USE?
                    break;
                case 'oval':
                    mode='ovalSize';
                    // dx=dy=0; // MOVE FOR GENERAL USE?
                    break;
                case 'arc':
                    mode='arcSize';
                    var d=element.getAttribute('d');
                    getArc(d);
                    x0=arc.cx;
                    y0=arc.cy;
                    console.log('arc centre: '+x0+','+y0+' radius: '+arc.radius);
                    id('blueBox').setAttribute('width',0);
                    id('blueBox').setAttribute('height',0);
                    id('blueOval').setAttribute('cx',x0); // circle for radius
                    id('blueOval').setAttribute('cy',y0);
                    id('blueOval').setAttribute('rx',arc.r);
                    id('blueOval').setAttribute('ry',arc.r);
                    id('blueLine').setAttribute('x1',x0); // prepare radius
                    id('blueLine').setAttribute('y1',y0);
                    id('blueLine').setAttribute('x2',x0);
                    id('blueLine').setAttribute('y2',y0);
                    id('guides').style.display='block';
                    break;
            }
            id('drawing').addEventListener('pointermove',drag);
            return;
        }
    }
    snap=snapCheck(); //  JUST DO if(snapCheck())?
    console.log('SNAP: '+snap);
    if(snap) { // snap start/centre to snap target
        x0=x;
        y0=y;
    }
    console.log('mode: '+mode);
    switch(mode) {
        case 'sketch':
            blueline=id('bluePolyline');
            var point=id('svg').createSVGPoint();
            point.x=x;
            point.y=y;
            blueline.points[0]=point;
            id('guides').style.display='block';
            console.log('start point: '+x+','+y+'; points: '+blueline.points);
            break;
        case 'line':
            blueline=id('bluePolyline');
            var point=id('svg').createSVGPoint();
            point.x=x;
            point.y=y;
            if(blueline.points.length>1) {
            // if(element.points.length>1) {
                point=blueline.points[blueline.points.length-1];
                // point=element.points[element.points.length-1];
                x0=point.x;
                y0=point.y;
            }
            else if(blueline.points.length>0) blueline.points[0]=point;
            blueline.points.appendItem(point);
            refreshNodes(blueline); // set blueline nodes to match new point
            id('guides').style.display='block';
            prompt('LINES: drag to next point; tap twice to end lines or on start to close shape');
            break;
        case 'box':
            id('blueBox').setAttribute('x',x0);
            id('blueBox').setAttribute('y',y0);
            id('guides').style.display='block';
            prompt('BOX: drag to size');
            break;
        case 'oval':
            id('blueOval').setAttribute('cx',x0);
            id('blueOval').setAttribute('cy',y0);
            id('guides').style.display='block';
            prompt('OVAL: drag to size');
            break;
        case 'arc':
            arc.cx=x0;
            arc.cy=y0;
            prompt('ARC: drag to start');
            id('blueLine').setAttribute('x1',arc.cx);
            id('blueLine').setAttribute('y1',arc.cy);
            id('blueLine').setAttribute('x2',arc.cx);
            id('blueLine').setAttribute('y2',arc.cy);
            id('guides').style.display='block';
            break;
        case 'text':
            console.log('show text dialog');
            id('textDialog').style.left=scr.x+'px';
            id('textDialog').style.top=scr.y+'px';
            id('text').value='';
            id('textDialog').style.display='block';
            break;
        case 'stamp':
            console.log('place stamp '+stampID+' at '+x0+','+y0);
            var graph={};
	        graph.type='stamp';
            graph.name=stampID;
            graph.x=x0;
            graph.y=y0;
            graph.spin=0;
	        graph.flip=0;
	        addGraph(graph);
	        cancel();
            break;
        case 'select':
        case 'pointEdit':
            id('selectionBox').setAttribute('x',x0);
            id('selectionBox').setAttribute('y',y0);
            id('guides').style.display='block';
            selectionBox.x=x0;
            selectionBox.y=y0;
            selectionBox.w=selectionBox.h=0;
    }
    event.stopPropagation();
    console.log('exit pointer down code');
    if(mode!='stamp') id('drawing').addEventListener('pointermove',drag);
});
// POINTER MOVE
function drag(event) {
    event.preventDefault();
    scr.x=Math.round(event.clientX);
    scr.y=Math.round(event.clientY);
    x=Math.round(scr.x*f/zoom+dwg.x);
    y=Math.round(scr.y*f/zoom+dwg.y);
    if((Math.abs(x-x0)<snapD)&&(Math.abs(y-y0)<snapD)) return; // ignore tiny drag
    // console.log('drag from '+x0+','+y0+' to '+x+','+y+' mode: '+mode);
    if(mode!='arcEnd') {
        snap=snapCheck(); // snap to nearby nodes, datum,...
        // console.log('SNAP: '+snap);
        if(!snap) {
            if(Math.abs(x-x0)<snapD) x=x0; // ...vertical...
            if(Math.abs(y-y0)<snapD) y=y0; // ...or horizontal
        }
    }
    if(mode.startsWith('movePoint')) {
        // var n=parseInt(mode.substr(9));
        console.log('drag polyline point '+n+' to '+x+','+y);
        id('bluePolyline').points[node].x=x;
        id('bluePolyline').points[node].y=y;
    }
    else switch(mode) {
        case 'sketch':
            dx=x-x0;
            dy=y-y0;
            var d=Math.sqrt(dx*dx+dy*dy);
            if(d>10) {
                console.log('add point');
                var point=id('svg').createSVGPoint();
                point.x=x;
                point.y=y;
                blueline.points.appendItem(point);
                x0=x;
                y0=y;
            }
            break;
        case 'move':
            if(selection.length>1) { // move multiple selection
                dx=x-x0;
                dy=y-y0;
                id('selection').setAttribute('transform','translate('+dx+','+dy+')');
            }
            else { // drag  single element
                id('blueBox').setAttribute('x',Number(x)+Number(offset.x));
                id('blueBox').setAttribute('y',Number(y)+Number(offset.y));
                // console.log('dragged to '+x+','+y);
            }
            break;
        case 'boxSize':
            var aspect=w/h;
            dx=(node%2<1)?(x-x0):(x0-x);
            dy=(node>2)?(y-y0):(y0-y);
            if(Math.abs(dx)<(snapD*2)) dx=0; // snap to equal width,...
            else if(Math.abs(dy)<(snapD*2)) dy=0; // ...equal height,... 
            else if((w+dx)/(h+dy)>aspect) dy=dx/aspect; // ...or equal proportion
            else dx=dy*aspect;
            x=parseInt(element.getAttribute('x'));
            y=parseInt(element.getAttribute('y'));
            w=parseInt(element.getAttribute('width'));
            h=parseInt(element.getAttribute('height'));
            if(node%2>0) id('blueBox').setAttribute('x',(x-dx)); // sizing left edge
            if(node<3) id('blueBox').setAttribute('y',(y-dy)); // sizing top edge
            w+=dx;
            h+=dy;
            id('blueBox').setAttribute('width',w);
            id('blueBox').setAttribute('height',h);
            break;
        case 'ovalSize':
            var aspect=w/h;
            dx=(node%2<1)?(x-x0):(x0-x);
            dy=(node>2)?(y-y0):(y0-y);
            if(Math.abs(dx)<(snapD*2)) dx=0; // snap to equal width,...
            else if(Math.abs(dy)<(snapD*2)) dy=0; // ...equal height,... 
            else if((w+dx)/(h+dy)>aspect) dy=dx/aspect; // ...or equal proportion
            else dx=dy*aspect;
            x=parseInt(element.getAttribute('cx')); // centre
            y=parseInt(element.getAttribute('cy'));
            w=parseInt(element.getAttribute('rx'))*2; // overall size
            h=parseInt(element.getAttribute('ry'))*2;
            x-=w/2; // left
            y-=h/2; // top
            if(node%2>0) id('blueBox').setAttribute('x',(x-dx)); // sizing left edge
            if(node<3) id('blueBox').setAttribute('y',(y-dy)); // sizing top edge
            w+=dx;
            h+=dy;
            id('blueBox').setAttribute('width',w);
            id('blueBox').setAttribute('height',h);
            break;
        case 'arcSize':
            dx=x-x0;
            dy=y-y0;
            var r=Math.sqrt((dx*dx)+(dy*dy));
            if(Math.abs(r-arc.r)<snapD) { // change angle but not radius
                id('blueLine').setAttribute('x2',x);
                id('blueLine').setAttribute('y2',y);
                id('blueOval').setAttribute('cx',arc.cx);
                id('blueOval').setAttribute('cy',arc.cy);
                id('blueOval').setAttribute('rx',arc.r);
                id('blueOval').setAttribute('ry',arc.r);
                var a=Math.atan(dy/dx); // radians
                a=a*180/Math.PI+90; // 'compass' degrees
                if(dx<0) a+=180;
                id('second').value=a; // new angle
            }
            else { // change radius but not angle
            id('blueOval').setAttribute('cx',arc.cx);
                id('blueOval').setAttribute('cy',arc.cy);
                id('blueOval').setAttribute('rx',r);
                id('blueOval').setAttribute('ry',r);
                id('blueLine').setAttribute('x2',x0);
                id('blueLine').setAttribute('y2',y0);
                id('first').value=r; // new radius
            }
            break;
        case 'pan':
            view.x=dwg.x-(x-x0);
            view.y=dwg.y-(y-y0);
            view.box=view.x+' '+view.y+' '+view.w+' '+view.h;
            id('background').setAttribute('viewBox',view.box);
            id('svg').setAttribute('viewBox',view.box);
            break;
        case 'line':
        // case 'shape':
            if(Math.abs(x-x0)<snapD) x=x0; // snap to vertical
            if(Math.abs(y-y0)<snapD) y=y0; // snap to horizontal
            var n=blueline.points.length;
            // var n=element.points.length;
            var point=blueline.points[n-1];
            // var point=element.points[n-1];
            point.x=x;
            point.y=y;
            blueline.points[n-1]=point;
            break;
        case 'box':
            w=Math.abs(x-x0);
            h=Math.abs(y-y0);
            if(Math.abs(w-h)<snapD*2) w=h; // snap to square
            var left=(x<x0)?(x0-w):x0;
            var top=(y<y0)?(y0-h):y0;
            id('blueBox').setAttribute('x',left);
            id('blueBox').setAttribute('y',top);
            id('blueBox').setAttribute('width',w);
            id('blueBox').setAttribute('height',h);
            break;
        case 'oval':
            w=Math.abs(x-x0);
            h=Math.abs(y-y0);
            if(Math.abs(w-h)<snapD*2) w=h; // snap to circle
            // var left=(x<x0)?(x0-w):x0;
            // var top=(y<y0)?(y0-h):y0;
            id('blueOval').setAttribute('cx',x0);
            id('blueOval').setAttribute('cy',y0);
            id('blueOval').setAttribute('rx',w/2);
            id('blueOval').setAttribute('ry',h/2);
            break;
        case 'arc':
            if(Math.abs(x-x0)<snapD) x=x0; // snap to vertical
            if(Math.abs(y-y0)<snapD) y=y0; // snap to horizontal
            w=x-x0;
            h=y-y0;
            if((Math.abs(w)<2)&&(Math.abs(h)<2)) break; // wait for significant movement
            arc.x1=x;
            arc.y1=y;
            arc.radius=Math.round(Math.sqrt(w*w+h*h));
            id('blueLine').setAttribute('x2',arc.x1);
            id('blueLine').setAttribute('y2',arc.y1);
            id('blueOval').setAttribute('cx',arc.cx);
            id('blueOval').setAttribute('cy',arc.cy);
            id('blueOval').setAttribute('rx',arc.radius);
            id('blueOval').setAttribute('ry',arc.radius);
            break;
        case 'arcEnd':
            if((x==x0)&&(y==y0)) break;
            if(arc.sweep==null) {
                // console.log('set arc sweep direction');
                if(Math.abs(y-arc.cy)>Math.abs(x-arc.cx)) { // get sweep from horizontal movement
                    console.log('get sweep from x - x0: '+x0+'; x: '+x);
                    if(y<arc.cy) arc.sweep=(x>x0)?1:0; // above...
                    else arc.sweep=(x<x0)?1:0; // ...or below centre of arc
                }
                else {
                    console.log('get sweep from y');
                    if(x<arc.cx) arc.sweep=(y<y0)?1:0; // left or...
                    else arc.sweep=(y>y0)?1:0; // ...right of centre of arc
                }
                console.log('ARC sweep SET TO '+arc.sweep);
            }
            w=x-arc.cx;
            h=y-arc.cy;
            arc.a2=Math.atan(h/w); // radians clockwise from x-axis ????????????
            if(w<0) arc.a2+=Math.PI; // from -PI/2 to 1.5PI
            arc.a2+=Math.PI/2; // 0 to 2PI
            arc.x2=Math.round(arc.cx+arc.r*Math.sin(arc.a2));
            arc.y2=Math.round(arc.cy-arc.r*Math.cos(arc.a2));
            arc.a2*=180/Math.PI; // 0-360 degrees
            x=arc.x2;
            y=arc.y2;
            x0=arc.cx;
            y0=arc.cy;
            id('blueRadius').setAttribute('x2',arc.x2);
            id('blueRadius').setAttribute('y2',arc.y2);
            break;
        case 'dimPlace':
            if(dim.dir=='v') {
                id('blueDim').setAttribute('x1',x);
                id('blueDim').setAttribute('x2',x);
                dim.offset=Math.round(x-dim.x1);
            }
            else if(dim.dir=='h') {
                id('blueDim').setAttribute('y1',y);
                id('blueDim').setAttribute('y2',y);
                dim.offset=Math.round(y-dim.y1);
            }
            else { // oblique dimension needs some calculation
                dx=dim.x2-dim.x1;
                dy=dim.y2-dim.y1;
                var a=Math.atan(dy/dx); // angle of line between start and end of dimension
                dx=x-x0;
                dy=y-y0;
                o=Math.sqrt(dx*dx+dy*dy);
                if((y<y0)||((y==y0)&&(x<x0))) o=o*-1;
                dim.offset=Math.round(o);
                id('blueDim').setAttribute('x1',dim.x1-o*Math.sin(a));
                id('blueDim').setAttribute('y1',dim.y1+o*Math.cos(a));
                id('blueDim').setAttribute('x2',dim.x2-o*Math.sin(a));
                id('blueDim').setAttribute('y2',dim.y2+o*Math.cos(a));
            }
            break;
        case 'dimAdjust':
            id('blueLine').setAttribute('y1',y);
            id('blueLine').setAttribute('y2',y);
            break;
        case 'select':
        case 'pointEdit':
            var boxX=(x<x0)?x:x0;
            var boxY=(y<y0)?y:y0;
            w=Math.abs(x-x0);
            h=Math.abs(y-y0);
            id('selectionBox').setAttribute('x',boxX);
            id('selectionBox').setAttribute('y',boxY);
            id('selectionBox').setAttribute('width',w);
            id('selectionBox').setAttribute('height',h);
            selectionBox.x=boxX;
            selectionBox.y=boxY;
            selectionBox.w=w;
            selectionBox.h=h;
    }
    event.stopPropagation();
};
// POINTER UP
id('drawing').addEventListener('pointerup',function() {
    console.log('pointer up at '+x+','+y+' mode: '+mode);
    id('drawing').removeEventListener('pointermove',drag);
    snap=snapCheck(); // NEEDED???
    console.log('snap - x:'+snap.x+' y:'+snap.y+' n:'+snap.n);
    if(mode.startsWith('movePoint')) { // move polyline/polygon point
        id('handles').innerHTML='';
        // var n=parseInt(mode.substr(9));
        console.log('move point '+node+' on '+type(element));
        if(type(element)=='sketch') {
            var graphs=db.transaction('graphs','readwrite').objectStore('graphs');
	        var request=graphs.get(Number(element.id));
	        request.onsuccess=function(event) {
	            var graph=request.result;
	            console.log('got graph '+graph.id);
	            graph.points[node].x=x;
	            graph.points[node].y=y;
	            request=graphs.put(graph);
	            request.onsuccess=function(event) {
			        console.log('graph '+graph.id+' updated');
			        var d=sketchPath(graph.points);
			        console.log('new path: '+d);
			        id(graph.id).setAttribute('d',sketchPath(graph.points)); // redraw sketch element path
		        };
	            request.onerror=function(event) {
		            console.log("PUT ERROR updating graph "+graph.id);
		        }
	        }
	    }
        else { // lines & shapes
            element.points[node].x=x;
            element.points[node].y=y;
            if((Math.abs(x-x0)<snapD)&&(Math.abs(y-y0)<snapD)) { // no drag - swop to mover
                console.log('TAP - add mover at node '+node); // node becomes new element 'anchor'
                var html="<use id='mover"+node+"' href='#mover' x='"+x+"' y='"+y+"'/>";
                id('handles').innerHTML=html;
                mode='edit';
                return;
            }
            updateGraph(element.id,['points',element.getAttribute('points')]);
            id('bluePolyline').setAttribute('points','0,0');
            refreshNodes(element);
        }
        cancel();
    }
    else switch(mode) {
        case 'move':
            id('handles').innerHTML='';
            id('blueBox').setAttribute('width',0);
            id('blueBox').setAttribute('height',0);
            if(selection.length>0) {
                dx=x-x0;
                dy=y-y0;
                console.log('selection moved by '+dx+','+dy);
            }
            else selection.push(element.id); // move single element
            switch(type(element)) {
                case 'sketch':
                case 'line':
                case 'shape':
                case 'box':
                    dx=x-x0+offset.x;
                    dy=y-y0+offset.y;
                    break;
                case 'oval':
                    dx=x-x0+w/2+offset.x;
                    dy=y-y0+h/2+offset.y;
                    break;
                case 'arc':
                    console.log('moved arc - node is '+node);
                    dx=x-x0;
                    dy=y-y0;
                    //
                    if(node==1) {
                        dx+=(arc.cx-arc.x1);
                        dy+=(arc.cy-arc.y1);
                    }
                    else if(node==2) {
                        dx+=(arc.cx-arc.x2);
                        dy+=(arc.cy-arc.y2);
                    }
                    //
                    break;
                default:
                    dx=x-x0;
                    dy=y-y0;
            }
            if(copy.active) { // copy-move so selection should be copies
            	copy.x+=dx;
            	copy.y+=dy;
            	// copy.active=false;
            	console.log('copy done - offsets: '+copy.x+','+copy.y);
            	selection=[];
            	while(copy.elements.length>0) selection.push(copy.elements.shift());
            	console.log('selection includes '+selection.length+' copied elements - first is '+selection[0]);
            }
            console.log('move '+selection.length+' elements by '+dx+','+dy);
            while(selection.length>0) { // move all selected elements
            	element=id(selection.pop());
                // elID=selection.pop();
                console.log('move element '+element.id);
                // element=id(elID);
                move(element,dx,dy);
                if(copy.active) select(element);
                else cancel();
            }
            id('selection').setAttribute('transform','translate(0,0)');
            // cancel();
            break;
        case 'boxSize':
            console.log('pointer up - moved: '+dx+'x'+dy);
            if((Math.abs(dx)<snapD)&&(Math.abs(dy)<snapD)) { // node tapped - add mover
                console.log('TAP - add mover at node '+node);
                var html="<use id='mover"+node+"' href='#mover' x='"+x+"' y='"+y+"'/>";
                id('handles').innerHTML=html;
                mode='edit';
                return;
            }
            id('handles').innerHTML='';
            x=id('blueBox').getAttribute('x');
            y=id('blueBox').getAttribute('y');
            w=id('blueBox').getAttribute('width');
            h=id('blueBox').getAttribute('height');
            updateGraph(element.id,['x',x,'y',y,'width',w,'height',h]);
            element.setAttribute('x',x);
            element.setAttribute('y',y);
            element.setAttribute('width',w);
            element.setAttribute('height',h);
            id('blueBox').setAttribute('width',0);
            id('blueBox').setAttribute('height',0);
            refreshNodes(element);
            cancel();
            break;
        case 'ovalSize':
            if((Math.abs(dx)<snapD)&&(Math.abs(dy)<snapD)) { // node tapped - add mover
                console.log('TAP - add mover at node '+node);
                var html="<use id='mover"+node+"' href='#mover' x='"+x+"' y='"+y+"'/>";
                id('handles').innerHTML=html;
                mode='edit';
                return;
            }
            id('handles').innerHTML='';
            x=Number(id('blueBox').getAttribute('x'));
            y=Number(id('blueBox').getAttribute('y'));
            w=Number(id('blueBox').getAttribute('width'));
            h=Number(id('blueBox').getAttribute('height'));
            updateGraph(element.id,['cx',(x+w/2),'y',(y+h/2),'rx',w/2,'height',h/2]);
            element.setAttribute('cx',(x+w/2));
            element.setAttribute('cy',(y+h/2));
            element.setAttribute('rx',w/2);
            element.setAttribute('ry',h/2);
            id('blueBox').setAttribute('width',0);
            id('blueBox').setAttribute('height',0);
            refreshNodes(element);
            cancel();
            break;
        case 'arcSize':
            if((Math.abs(dx)<snapD)&&(Math.abs(dy)<snapD)) { // node tapped - add mover
                console.log('TAP - add mover at node '+node);
                var html="<use id='mover"+node+"' href='#mover' x='"+x+"' y='"+y+"'/>";
                id('handles').innerHTML=html;
                mode='edit';
                return;
            }
            dx=x-x0;
            dy=y-y0;
            r=Math.sqrt((dx*dx)+(dy*dy));
            console.log('pointer up - radius: '+r);
            if(Math.abs(r-arc.r)<snapD) { // radius unchanged - set angle
                var a=Math.atan(dy/dx);
                if(node<2) {
                    arc.x1=x0+arc.r*Math.cos(a);
                    arc.y1=y0+arc.r*Math.sin(a);
                }
                else {
                    arc.x2=x0+arc.r*Math.cos(a);
                    arc.y2=y0+arc.r*Math.sin(a);
                }
            }
            else { // radius changed - adjust arc start...
                dx=arc.x1-arc.cx;
                dy=arc.y1-arc.cy;
                dx*=r/arc.r;
                dy*=r/arc.r;
                arc.x1=arc.cx+dx;
                arc.y1=arc.cy+dy;
                // ...and end points...
                dx=arc.x2-arc.cx;
                dy=arc.y2-arc.cy;
                dx*=r/arc.r;
                dy*=r/arc.r;
                arc.x2=arc.cx+dx;
                arc.y2=arc.cy+dy;
                // ...and radius 
                arc.r=r;
            }
            var d='M'+arc.cx+','+arc.cy+' M'+arc.x1+','+arc.y1+' A'+arc.r+','+arc.r+' 0 '+arc.major+','+arc.sweep+' '+arc.x2+','+arc.y2;
            element.setAttribute('d',d);
            updateGraph(element.id,['x1',arc.x1,'y1',arc.y1,'x2',arc.x2,'y2',arc.y2,'r',arc.r]);
            refreshNodes(element);
            id('handles').innerHTML='';
            id('blueOval').setAttribute('rx',0);
            id('blueOval').setAttribute('ry',0);
            cancel();
            break;
        case 'pan':
            console.log('pan ends at '+x+','+y);
            dwg.x-=(x-x0);
            dwg.y-=(y-y0);
            // STAY IN PAN MODE UNTIL TAP TO EXIT
            if((Math.abs(x-x0)<snapD)&&(Math.abs(y-y0)<snapD)) mode='select';
            // console.log('mode is '+mode);
            break;
        case 'sketch':
            console.log('end sketching');
            var points=id('bluePolyline').points;
            var point=id('svg').createSVGPoint(); // add end point
                point.x=x;
                point.y=y;
                points.appendItem(point);
            console.log(points.length+' points');
            // create smooth curved path
            var graph={};
	        graph.type='sketch';
	        graph.points=[]; // array of points
	        for(var i=0;i<points.length-1;i++) graph.points.push({x:points[i].x,y:points[i].y});
	        graph.spin=0;
	        graph.stroke=lineCol;
	        graph.lineW=lineW;
	        graph.lineStyle=lineType;
	        if(lineType=='none') graph.lineStyle='solid'; // cannot have empty stroke
	        graph.fillType='none';
	        graph.fill=fillCol;
	        graph.opacity=opacity;
	        graph.blur=blur;
	        addGraph(graph);
	        blueline.setAttribute('points','0,0');
            cancel();
            break;
        case 'line':
            console.log('pointer up - blueline is '+blueline.id);
            var n=blueline.points.length;
            if(snap) {  // adjust previous point to snap target
                blueline.points[n-1].x=x;
                blueline.points[n-1].y=y;
            }
            var n=blueline.points.length;
            console.log(n+' points');
            var d=Math.sqrt((x-x0)*(x-x0)+(y-y0)*(y-y0));
            refreshNodes(blueline); // set blueline nodes to match new point
            if((d<snapD)||(n>9)) { // click/tap to finish polyline - capped to 10 points
                console.log('END LINE');
                var points=blueline.points;
                console.log('points: '+points);
                // create polyline element
                var graph={};
	            graph.type='line';
	            graph.points='';
	            var len=0;
	            for(var i=0;i<points.length-1;i++) {
	                graph.points+=(points[i].x+','+points[i].y+' ');
	                if(i>0) len+=Math.abs(points[i].x-points[i-1].x)+Math.abs(points[i].y-points[i-1].y);
	            }
	            graph.spin=0;
	            graph.stroke=lineCol;
	            graph.lineW=lineW;
	            graph.lineStyle=lineType;
	            if(lineType=='none') graph.lineStyle='solid'; // cannot have empty line
	            graph.fillType='none';
	            graph.fill='none';
	            if(len>=1) addGraph(graph); // avoid zero-size lines
	            blueline.setAttribute('points','0,0');
	            cancel();
            }
            else { // check if close to start point
                point=blueline.points[0]; // start point
                console.log('at '+x+','+y+' start at '+point.x+','+point.y);
                dx=x-point.x;
                dy=y-point.y;
                var d=Math.sqrt(dx*dx+dy*dy);
                if(d<snapD) { // close to start - create shape
                    console.log('CLOSE SHAPE');
                    var points=blueline.points;
                    console.log('points: '+points);
                    var graph={}; // create polygon element
                    graph.type='shape';
                    graph.points='';
                    var len=0;
	                for(var i=0;i<points.length-1;i++) {
	                    graph.points+=(points[i].x+','+points[i].y+' ');
	                    if(i>0) len+=Math.abs(points[i].x-points[i-1].x)+Math.abs(points[i].y-points[i-1].y);
	                }
	                graph.spin=0;
	                graph.stroke=lineCol;
	                if(lineType=='none') graph.stroke='none';
	                graph.lineW=lineW;
	                graph.lineStyle=lineType;
	                graph.fillType='none';
	                graph.fill=fillCol;
	                if(len>=1) addGraph(graph); // avoid zero-size shapes
	                blueline.setAttribute('points','0,0');
	                cancel();
                }
            }
            break;
        case 'shape':
            if(snap) {  // adjust previous point to snap target
                var n=element.points.length;
                var point=element.points[n-1];
                point.x=x;
                point.y=y;
                element.points[n-1]=point;
            }
            point=element.points[0]; // start point
            console.log('at '+x+','+y+' start at '+point.x+','+point.y);
            dx=x-point.x;
            dy=y-point.y;
            var d=Math.sqrt(dx*dx+dy*dy);
            if((d>snapD)&&(n<11)) break; // check if close to start point - if not, continue but cap at 10 sides
            console.log('end polyline & create shape');
            var points=id('bluePolyline').points;
            console.log('points: '+points);
            var graph={}; // create polygon element
            graph.type='shape';
            graph.points='';
            var len=0;
	        for(var i=0;i<points.length-1;i++) {
	            graph.points+=(points[i].x+','+points[i].y+' ');
	            if(i>0) len+=Math.abs(points[i].x-points[i-1].x)+Math.abs(points[i].y-points[i-1].y);
	        }
	        graph.spin=0;
	        graph.stroke=lineCol;
	        if(lineType=='none') graph.stroke='none';
	        graph.lineW=lineW;
	        graph.lineStyle=lineType;
	        graph.fillType=fillType;
	        graph.fill=fillCol;
	        if(len>=1) addGraph(graph); // avoid zero-size shapes
	        id('bluePolyline').setAttribute('points','0,0');
	        cancel();
            break;
        case 'box':
            console.log('finish box');
            var graph={}
	        graph.type='box';
	        graph.x=parseInt(id('blueBox').getAttribute('x'));
	        graph.y=parseInt(id('blueBox').getAttribute('y'));
	        graph.width=w;
	        graph.height=h;
	        graph.radius=rad;
	        graph.spin=0;
	        graph.stroke=lineCol;
	        if(lineType=='none') graph.stroke='none';
	        graph.lineW=lineW;
	        graph.lineStyle=lineType;
	        graph.fillType=fillType;
	        graph.fill=fillCol;
	        graph.opacity=opacity;
	        graph.blur=blur;
	        if((graph.width>=1)&&(graph.width>=1)) addGraph(graph); // avoid zero-size boxes
            id('blueBox').setAttribute('width',0);
            id('blueBox').setAttribute('height',0);
            cancel();
            break;
        case 'oval':
            var graph={};
	        graph.type='oval';
	        graph.cx=parseInt(id('blueOval').getAttribute('cx'));
	        graph.cy=parseInt(id('blueOval').getAttribute('cy'));
	        graph.rx=w/2;
	        graph.ry=h/2;
	        graph.spin=0;
	        graph.stroke=lineCol;
	        if(lineType=='none') graph.stroke='none';
	        graph.lineStyle=lineType;
	        graph.lineW=lineW;
	        graph.fillType=fillType;
	        graph.fill=fillCol;
	        graph.opacity=opacity;
	        if((graph.rx>=1)&&(graph.ry>=1)) addGraph(graph); // avoid zero-size ovals
		    id('blueOval').setAttribute('rx',0);
            id('blueOval').setAttribute('ry',0);
            cancel();
            break;
        case 'arc':
            arc.x1=x;
            arc.y1=y;
            // console.log('arcCentre: '+arc.centreX+','+arc.centreY);
            w=arc.x1-arc.cx; // radii
            h=arc.y1-arc.cy;
            arc.r=Math.sqrt(w*w+h*h); // arc radius
            arc.a1=Math.atan(h/w); // start angle - radians clockwise from x-axis NO!!
            if(w<0) arc.a1+=Math.PI; // from -PI/2 to +1.5PI
            arc.a1+=Math.PI/2; // 0 to 2PI
            arc.a1*=180/Math.PI; // 0-180 degrees
            console.log('START ANGLE: '+(arc.a1)+'; radius: '+arc.r);
            arc.sweep=null; // determine sweep when move pointer
            arc.major=0; // always starts with minor arc
            x0=arc.x1;
            y0=arc.y1;
            id('blueRadius').setAttribute('x1',arc.cx); // draw blue arc radius with arrows
            id('blueRadius').setAttribute('y1',arc.cy); 
            id('blueRadius').setAttribute('x2',arc.x1); 
            id('blueRadius').setAttribute('y2',arc.y1);
            mode='arcEnd';
            break;
        case 'arcEnd':
            console.log('END ANGLE: '+arc.a2);
            var a=arc.a2-arc.a1;
            if(a<0) a+=360;
            if(arc.sweep<1) a=360-a;
            arc.major=(Math.abs(a)>180)? 1:0;
            console.log('arc angle: '+a+'deg; major: '+arc.major+'; sweep: '+arc.sweep);
            var graph={};
            graph.type='arc';
	        graph.cx=arc.cx; // centre coordinates
	        graph.cy=arc.cy;
	        graph.x1=arc.x1; // start point
	        graph.y1=arc.y1;
	        graph.x2=arc.x2; // end point
	        graph.y2=arc.y2;
	        graph.r=arc.r; // radius
	        graph.major=arc.major; // major/minor arc - 1/0
	        graph.sweep=arc.sweep; // direction of arc - 1: clockwise, 0: anticlockwise
	        graph.spin=0;
	        graph.stroke=lineCol;
	        graph.lineStyle=lineType;
	        if(lineType=='none') graph.lineType='solid'; // avoid empty arcs
	        graph.lineW=lineW;
	        graph.fillType='none'; // arcs default to no fill
	        graph.fill=fillCol;
	        graph.opacity=1;
	        if((arc.r>=1)&&(a!=0)) addGraph(graph); // avoid zero-size arcs
            id('blueOval').setAttribute('rx',0);
            id('blueOval').setAttribute('ry',0);
            id('blueLine').setAttribute('x1',0);
            id('blueLine').setAttribute('y1',0);
            id('blueLine').setAttribute('x2',0);
            id('blueLine').setAttribute('y2',0);
            id('blueRadius').setAttribute('x1',0);
            id('blueRadius').setAttribute('y1',0);
            id('blueRadius').setAttribute('x2',0);
            id('blueRadius').setAttribute('y2',0);
            cancel();
            break;
        case 'pointEdit':
            console.log('SELECT POINTS');
            if((selectionBox.w>20)&&(selectionBox.h>20)) { // significant selection box size
                var left=selectionBox.x;
                var right=selectionBox.x+selectionBox.w;
                var top=selectionBox.y;
                var bottom=selectionBox.y+selectionBox.h;
                console.log('box: '+left+'-'+right+' x '+top+'-'+bottom);
                var points=element.points;
                console.log('element has '+points.length+' points');
                selectedPoints=[];
                for(var i=0;i<points.length;i++) {
                    console.log('point '+i+': '+points[i].x+','+points[i].y);
                    if(points[i].x<left) continue;
                    if(points[i].y<top) continue;
                    if(points[i].x>right) continue;
                    if(points[i].y>bottom) continue;
                    selectedPoints.push(i);
                }
                console.log(selectedPoints.length+' points selected');
                if(selectedPoints.length>0) id('handles').innerHTML=''; // remove handles
                break;
            }
        case 'select':
            id('blueBox').setAttribute('width',0);
            id('blueBox').setAttribute('height',0);
            id('guides').style.display='none';
            console.log('box size: '+selectionBox.w+'x'+selectionBox.h);
            if((selectionBox.w>20)&&(selectionBox.h>20)) { // significant selection box size
                console.log('GROUP SELECTION - box: '+selectionBox.w+'x'+selectionBox.h+' at '+selectionBox.x+','+selectionBox.y);
                var items=id('dwg').childNodes;
                console.log(items.length+' elements in dwg');
                for(var i=0;i<items.length;i++) { // collect elements entirely within selectionBox
                    console.log('item '+i+': '+items[i].id);
                    var el=id(items[i].id);
                    if((type(el)=='dim')||!el) continue; // don't include dimensions or 'null' nodes
                    var box=getBounds(items[i]);
                    console.log('bounds for '+items[i].id+": "+box.x+','+box.y);
                    console.log('item '+items[i].id+' box: '+box.width+'x'+box.height+' at '+box.x+','+box.y);
                    if(box.x<selectionBox.x) continue;
                    if(box.y<selectionBox.y) continue;
                    if((box.x+box.width)>(selectionBox.x+selectionBox.w)) continue;
                    if((box.y+box.height)>(selectionBox.y+selectionBox.h)) continue;
                    selection.push(items[i].id); // add to selection if passes tests
                    console.log('select '+items[i].id);
                    // if(type(el)=='stamp') continue; // no blue box for stamps
                    var html="<rect x='"+box.x+"' y='"+box.y+"' width='"+box.width+"' height='"+box.height+"' ";
                    html+="stroke='none' fill='blue' fill-opacity='0.25' el='"+items[i].id+"'/>";
                    id('selection').innerHTML+=html;
                }
                if(selection.length>0) { // highlight selected elements
                    mode='edit';
                    showEditTools(true);
                    console.log(selection.length+' elements selected');
                    if(selection.length<2) {
                        console.log('only one selection');
                        id('selection').innerHTML=''; // no blue box
                        element=id(selection[0]);
                        // elID=selection[0];
                        // element=id(elID);
                        select(element); // add handles etc
                        // setStyle(element);
                    }
                    return;
                }
            }
            // break;
        case 'edit':
            var el=event.target;
            console.log('pointer up on element '+el.id);
            var hit=null;
            if(el.parentNode.id=='drawing') { // drawing background - check 10x10px zone
                console.log('nowt! - search locality');
                var e=-5;
                var n=-5;
                while(e<6 && !hit) {
                    n=-5;
                    while(n<6 && !hit) {
                        // console.log('check at '+e+','+n+' '+(scr.x+e)+','+(scr.y+n));
                        el=document.elementFromPoint(scr.x+e,scr.y+n);
                        console.log('element '+el.id);
                        if((el.id!='svg')&&(!el.id.startsWith('datum'))) hit=el.id; 
                        n++; 
                    }
                    e++;
                }
            }
            else while((el.parentNode.id!='dwg')&&(el.parentNode.id!='drawing')) {
                el=el.parentNode; // stamps have elements within groups in svg container
            }
            console.log('parent is '+el.parentNode.id);
            if(el.parentNode.id=='dwg') hit=el.id;
            if(hit) console.log('HIT: '+hit+' type: '+type(el));
            else console.log('MISS');
            console.log('selected: '+selection.length);
            if(hit) {
                if(selection.indexOf(hit)<0) { // add to selection
                    selection.push(hit);
                    if(selection.length<2) { // only item selected
                        // elID=hit;
                        element=id(hit);
                        select(element,false);
                        // element=id(elID);
                        // select(element);
                    }
                    else { // multiple selection
                        console.log('add '+type(el)+' '+el.id+' to multiple selection');
                        if(selection.length<3) {
                            console.log('SECOND SELECTED ITEM');
                            id('handles').innerHTML='';
                            select(id(selection[0]),true); // highlight first selected item
                        }
                        select(el,true);
                        /* OLD CODE
                        var box=getBounds(el);
                        var html="<rect x='"+box.x+"' y='"+box.y+"' width='"+box.width+"' height='"+box.height+"' ";
                        html+="stroke='none' fill='blue' fill-opacity='0.25' el='"+hit+"'/>";
                        console.log('box html: '+html);
                        id('selection').innerHTML+=html; // blue block for this element
                        if(selection.length<3) {
                            console.log('SECOND SELECTED ITEM');
                            id('handles').innerHTML='';
                            el=id(selection[0]);
                            box=getBounds(el);
                            var html="<rect x='"+box.x+"' y='"+box.y+"' width='"+box.width+"' height='"+box.height+"' ";
                            html+="stroke='none' fill='blue' fill-opacity='0.25' el='"+hit+"'/>";
                            id('selection').innerHTML+=html; // blue block for first element
                        }
                        */
                        // TRY WITHOUT setStyle(); // SET STYLES TO DEFAULTS
                    }
                    setStyle();
                    setButtons();
                } // else ignore clicks on items already selected
                showEditTools(true);
            }
            else { // TRY THIS - CLICK ON BACKGROUND CLEARS SELECTION
                cancel();
            }
    }
    event.stopPropagation();
});
id('undoButton').addEventListener('click',function() {
    re('call'); // recall & reinstate previous positions/points/sizes/spins/flips
});
// UTILITY FUNCTIONS
function addGraph(el) {
    console.log('add '+el.type+' element - spin: '+el.spin);
    if(el.points) console.log(el.points.length+' points');
    var request=db.transaction('graphs','readwrite').objectStore('graphs').add(el);
    request.onsuccess=function(event) {
        // console.log('result: '+event.target.result);
        el.id=event.target.result;
        console.log('graph added - id: '+el.id+' - draw');
        id('dwg').appendChild(makeElement(el));
        if(copy.active) copy.elements.push(el.id);
    }
    request.onerror=function(event) {
        console.log('add copy failed');
    }
}
function cancel() { // cancel current operation and return to select mode
    mode='select';
    copy.active=false;
    id('tools').style.display='block';
    element=null;
    selection=[];
    selectedPoints=[];
    selectionBox.w=selectionBox.h=0;
    id('selection').innerHTML='';
    id('handles').innerHTML=''; //remove element handles...
    id('selectionBox').setAttribute('width',0);
    id('selectionBox').setAttribute('height',0);
    id('blueBox').setAttribute('width',0);
    id('blueBox').setAttribute('height',0);
    id('blueOval').setAttribute('rx',0);
    id('blueOval').setAttribute('ry',0);
    id('bluePolyline').setAttribute('points','0,0');
    id('guides').style.display='none';
    showEditTools(false);
    id('textDialog').style.display='none';
    // TRY WITHOUT setStyle(); // set styles to defaults
}
function download(content,fileName,contentType) {
	console.log("save as "+fileName);
	var a=document.createElement('a');
	var file=new Blob([content], {type:contentType});
	a.href=URL.createObjectURL(file);
	a.download=fileName;
	a.click();
	alert('file '+fileName+" saved to downloads folder");
}
function getAngle(x0,y0,x1,y1) {
    var dx=x1-x0;
    var dy=y1-y0;
    var a=Math.atan(dy/dx); // range -PI/25 to +PI/2
    a*=180/Math.PI; // -90 to +90 degrees
    a+=90; // 0-180
    if(dx<0) a+=180; // 0-360
    return a;
}
function getArc(d) {
    arc={};
    console.log('get arc from: '+d);
    var from=1;
    var to=d.indexOf(',');
    arc.cx=parseInt(d.substr(from,to));
    from=to+1;
    to=d.indexOf(' ',from);
    arc.cy=parseInt(d.substr(from,to));
    from=d.indexOf('M',to)+1;
    to=d.indexOf(',',from);
    arc.x1=parseInt(d.substr(from,to));
    from=to+1;
    to=d.indexOf(' ',from);
    arc.y1=parseInt(d.substr(from,to));
    from=d.indexOf('A')+1;
    to=d.indexOf(',',from);
    arc.r=parseInt(d.substr(from,to));
    from=to+1;
    to=d.indexOf(',',from);
    arc.major=parseInt(d.charAt(to-1));
    arc.sweep=parseInt(d.charAt(to+1));
    from=d.indexOf(' ',to);
    to=d.indexOf(',',from);
    arc.x2=parseInt(d.substr(from,to));
    from=to+1;
    arc.y2=parseInt(d.substr(from));
    console.log('arc centre: '+arc.cx+','+arc.cy+' start: '+arc.x1+','+arc.y1+'; radius: '+arc.r+'; major: '+arc.major+'; sweep: '+arc.sweep+'; end: '+arc.x2+','+arc.y2);
}
function getBounds(el) {
    var b=el.getBBox();
    return b;
}
function getLineStyle(el) {
    if(el.getAttribute('stroke')=='none') return 'none';
    var lw=parseInt(el.getAttribute('stroke-width'));
    var dash=parseInt(el.getAttribute('stroke-dasharray'));
    if(dash>lw) return 'dashed';
    else if(dash==lw) return'dotted';
    else return 'solid';
}
function id(el) {
	return document.getElementById(el);
}
function initialise() {
    // SET DRAWING ASPECT
    console.log('set up:'+size+' size '+aspect+' drawing');
    handleR=2;
    snapD=2;
    var major=[0,840,594,420,297,210,148,200,210,300,150,180,200,250,300,400,500,700];
    var minor=[0,594,420,297,210,148,105,200,210,300,100,130,150,200,250,300,400,500];
    dwg.w=(aspect=='landscape')?major[size]:minor[size]; // CHANGE TO SUIT DRAWING SIZE
    dwg.h=(aspect=='landscape')?minor[size]:major[size];
    var blues=document.getElementsByClassName('blue');
    console.log(blues.length+' elements in blue class');
    for(var i=0;i<blues.length;i++) blues[i].style.strokeWidth=0.25;
    id('moveCircle').setAttribute('r',handleR);
    id('moveCircle').style.strokeWidth=1;
    id('sizeDisc').setAttribute('r',handleR);
    id('selectionBox').setAttribute('stroke-dasharray',(1+' '+1+' '));
    w=scr.w*f; // set viewports to fill screen
    h=scr.h*f;
    id('background').setAttribute('width',w+'mm');
    id('background').setAttribute('height',h+'mm');
    id('svg').setAttribute('width',w+'mm');
    id('svg').setAttribute('height',h+'mm');
    reset(); // adjusts drawing to fit screen
    console.log('viewbox: '+id('svg').getAttribute('viewBox'));
    w=dwg.w;
    h=dwg.h;
    id('background').innerHTML="<rect x='0' y='0' width='"+w+"' height='"+h+"' fill='white'/>";
    html="<rect x='0' y='0' width='"+w+"' height='"+h+"'/>"; // clip to drawing edges
    id('clipper').innerHTML=html;
    for(var i=0;i<10;i++) nodes.push({'x':0,'y':0,'n':i}); // 10 nodes for blueline
    for(var i=0;i<10;i++) console.log('node '+i+': '+nodes[i].n+' at '+nodes[i].x+','+nodes[i].y);
    // id('countH').value=id('countV').value=1;
    cancel(); // set select mode
}
function load() {
    var request=db.transaction('graphs').objectStore('graphs').openCursor();
    request.onsuccess = function(event) {  
	    var cursor=event.target.result;  
        if(cursor) {
            var graph=cursor.value;
            console.log('load '+graph.type+' id: '+graph.id);
            var el=makeElement(graph);
            if(graph.stroke=='blue') id('ref').appendChild(el); // blue items go into <ref>
            else id('dwg').appendChild(el);
	    	cursor.continue();  
        }
	    else {
	        console.log('all graphs added');
	    }
    };
    console.log('all graphs loaded');
    id('stampList').innerHTML="<option onclick='prompt(\'select a stamp\');' value=null>select a stamp</option>"; // rebuild stampList
    var request=db.transaction('stamps').objectStore('stamps').openCursor();
    request.onsuccess = function(event) {  
	    var cursor=event.target.result;  
        if(cursor) {
            var stamp=cursor.value;
            // GET STAMP NAME AND ADD TO stampList AS AN OPTION
            var name=stamp.name;
            console.log('add stamp '+name);
            var html="<g id='"+name+"'>"+stamp.svg+"</g>"; // TRY WITHOUT ax,ay
            // var html="<g id='"+name+"' ax='"+stamp.ax+"' ay='"+stamp.ay+"'>"+stamp.svg+"</g>";
            id('stamps').innerHTML+=html; // copy stamp svg into <defs>...
            html="<option value="+name+">"+name+"</option>";
            id('stampList').innerHTML+=html; //...and stamp name into stampList
            console.log('added');
	    	cursor.continue();  
        }
	    else {
		    console.log("No more stamps");
	    }
    };
}
function makeElement(g) {
    console.log('make '+g.type+' element '+g.id);
    var ns=id('svg').namespaceURI;
    switch(g.type) {
        case 'sketch':
            var el=document.createElementNS(ns,'path');
            el.setAttribute('id',g.id);
            console.log('points: '+g.points);
            el.setAttribute('points',g.points);
            el.setAttribute('d',sketchPath(g.points));
            el.setAttribute('spin',g.spin);
            if(g.spin!=0) setTransform(el); // apply spin MAY NOT WORK!!!
            nodes.push({'x':g.points[0].x,'y':g.points[0].y,'n':Number(g.id*10+0)});
            break;
        case 'line':
            var el=document.createElementNS(ns,'polyline');
            el.setAttribute('id',g.id);
            el.setAttribute('points',g.points);
            el.setAttribute('spin',g.spin);
            var points=el.points;
            for(var i=0;i<points.length;i++) { // IF HAS SPIN - USE refreshNodes()?
                nodes.push({'x':points[i].x,'y':points[i].y,'n':Number(g.id*10+i)});
                console.log('add node '+i+' at '+points[i].x+','+points[i].y);
            } // NB node.n is id*10+[0-9]
			if(g.spin!=0) setTransform(el); // apply spin MAY NOT WORK!!!
            break;
        case 'shape':
            var el=document.createElementNS(ns,'polygon');
            el.setAttribute('id',g.id);
            el.setAttribute('points',g.points);
            el.setAttribute('spin',g.spin);
            var points=el.points;
            for(var i=0;i<points.length;i++) { // IF HAS SPIN - USE refreshNodes()?
                nodes.push({'x':points[i].x,'y':points[i].y,'n':Number(g.id*10+i)});
                console.log('add node '+i+' at '+points[i].x+','+points[i].y);
            }
			if(g.spin!=0) setTransform(el); // apply spin MAY NOT WORK!!!
            break;
        case 'box':
            var el=document.createElementNS(ns,'rect');
            el.setAttribute('id',g.id);
            el.setAttribute('x',g.x);
            el.setAttribute('y',g.y);
            el.setAttribute('width',g.width);
            el.setAttribute('height',g.height);
            el.setAttribute('rx',g.radius);
            el.setAttribute('spin',g.spin);
            console.log('made box'); // ADD NODES
            nodes.push({'x':(Number(g.x)+Number(g.width/2)),'y':(Number(g.y)+Number(g.height/2)),'n':Number(g.id*10+4)}); // centre - node 0
            nodes.push({'x':g.x,'y':g.y,'n':(g.id*10)}); // top/left - node 1
            nodes.push({'x':(Number(g.x)+Number(g.width)),'y':g.y,'n':Number(g.id*10+1)}); // top/right - node 2
            nodes.push({'x':g.x,'y':(Number(g.y)+Number(g.height)),'n':Number(g.id*10+3)}); // bottom/left - node 3
            nodes.push({'x':(Number(g.x)+Number(g.width)),'y':(Number(g.y)+Number(g.height)),'n':Number(g.id*10+2)}); // bottom/right - node 4
            if(g.spin!=0) setTransform(el);
            break;
        case 'oval':
            var el=document.createElementNS(ns,'ellipse');
            el.setAttribute('id',g.id);
            el.setAttribute('cx',g.cx);
            el.setAttribute('cy',g.cy);
            el.setAttribute('rx',g.rx);
            el.setAttribute('ry',g.ry);
            el.setAttribute('spin',g.spin);
            console.log('made oval'); // ADD NODES
            // add nodes
            nodes.push({'x':g.cx,'y':g.cy,'n':(g.id*10)}); // centre: node 0
            nodes.push({'x':(g.cx-g.rx),'y':(g.cy-g.ry),'n':Number(g.id*10+1)}); // ...top/left: node 1
            nodes.push({'x':Number(g.cx)+Number(g.rx),'y':(g.cy-g.ry),'n':Number(g.id*10+2)}); // top/right: node 2
            nodes.push({'x':(g.cx-g.rx),'y':Number(g.cy)+Number(g.ry),'n':Number(g.id*10+3)}); // bottom/left: node 3
            nodes.push({'x':Number(g.cx)+Number(g.rx),'y':Number(g.cy)+Number(g.ry),'n':Number(g.id*10+4)}); // bottom/right: node 4
            // console.log('oval nodes added');
            if(g.spin!=0) setTransform(el);
            break;
        case 'arc':
            var el=document.createElementNS(ns,'path');
            el.setAttribute('id',g.id);
            var d='M'+g.cx+','+g.cy+' M'+g.x1+','+g.y1+' A'+g.r+','+g.r+' 0 '+g.major+','+g.sweep+' '+g.x2+','+g.y2;
            el.setAttribute('d',d);
            el.setAttribute('spin',g.spin);
            // create nodes for arc start, centre & end points USE refreshNodes()? AND ALLOW FOR SPIN
            nodes.push({'x':g.cx,'y':g.cy,'n':(g.id*10)}); // centre - node 0
            nodes.push({'x':g.x1,'y':g.y1,'n':Number(g.id*10+1)}); // start - node 1
            nodes.push({'x':g.x2,'y':g.y2,'n':Number(g.id*10+2)}); // end - node 2
            if(g.spin!=0) setTransform(el);
            break;
        case 'text':
            var el=document.createElementNS(ns,'text');
            el.setAttribute('id',g.id);
            el.setAttribute('x',g.x);
            el.setAttribute('y',g.y);
            el.setAttribute('spin',g.spin);
            el.setAttribute('flip',g.flip);
            el.setAttribute('font-family',g.textFont);
            el.setAttribute('font-size',g.textSize);
            if(g.textStyle=='bold') el.setAttribute('font-weight','bold');
            else if(g.textStyle=='italic') el.setAttribute('font-style','italic');
            el.setAttribute('stroke','none');
            el.setAttribute('fill',g.fill);
            if(g.opacity<1) {
                el.setAttribute('stroke-opacity',g.opacity);
                el.setAttribute('fill-opacity',g.opacity);
            }
            if(g.blur>0) el.setAttribute('filter','url(#blur'+g.blur+')');
            var t=document.createTextNode(g.text);
            el.appendChild(t);
            id('textDialog').style.display='none';
            if((g.spin!=0)||(g.flip!=0)) setTransform(el);
            break;
        case 'stamp':
            var el=document.createElementNS(ns,'use');
            el.setAttribute('id',g.id);
            el.setAttribute('href','#'+g.name);
            el.setAttribute('x',g.x);
            el.setAttribute('y',g.y);
            el.setAttribute('spin',g.spin);
            el.setAttribute('flip',g.flip);
            nodes.push({'x':g.x,'y':g.y,'n':(g.id*10)});
            if((g.spin!=0)||(g.flip!=0)) setTransform(el);
            break;
    }
    if((g.type!='text')&&(g.type!='stamp')) { // set style
    	el.setAttribute('stroke',g.stroke);
		el.setAttribute('stroke-width',g.lineW);
		var dash=setLineStyle(g);
		if(dash) el.setAttribute('stroke-dasharray',dash);
		if(g.fillType.startsWith('pattern')) {
			var n=Number(g.fillType.substr(7));
			console.log('fillType is '+g.fillType);
			var html="<pattern id='pattern"+g.id+"' index='"+n+"' width='"+pattern[n].width+"' height='"+pattern[n].height+"' patternUnits='userSpaceOnUse'";
			if(pattern[n].spin>0) html+=" patternTransform='rotate("+pattern[n].spin+")'";
			html+='>'+pattern[n].svg+'</pattern>';
			console.log('pattern HTML: '+html);
			id('defs').innerHTML+=html;
			id('pattern'+g.id).firstChild.setAttribute('fill',g.fill);
			id('pattern'+g.id).lastChild.setAttribute('fill',g.fill);
			el.setAttribute('fill','url(#pattern'+g.id+')');
		}
		else el.setAttribute('fill',(g.fill=='none')?'none':g.fill);
		if(g.opacity<1) {
			el.setAttribute('stroke-opacity',g.opacity);
			el.setAttribute('fill-opacity',g.opacity);
		}
		if(g.blur>0) el.setAttribute('filter','url(#blur'+g.blur+')');
    }
    return el;
}
function move(el,dx,dy) {
    switch(type(el)) {
        case 'sketch':
            console.log('move all points by '+dx+','+dy);
            var graphs=db.transaction('graphs','readwrite').objectStore('graphs');
	        var request=graphs.get(Number(el.id));
	        request.onsuccess=function(event) {
	            var graph=request.result;
	            console.log('got graph '+graph.id);
	            for(var i=0;i<graph.points.length;i++) {
	                graph.points[i].x+=dx;
	                graph.points[i].y+=dy;
	            }
	            request=graphs.put(graph);
	            request.onsuccess=function(event) {
			        console.log('graph '+el.id+' updated - starts at '+graph.points[0].x+','+graph.points[0].y);
			        el.setAttribute('d',sketchPath(graph.points)); // redraw sketch element path
		        };
		        request.onerror=function(event) {
		            console.log("PUT ERROR updating graph "+id);
		        };
	        }
            break;
        case 'line':
        case 'shape':
            console.log('move all points by '+dx+','+dy);
            var pts='';
            for(var i=0;i<el.points.length;i++) {
                el.points[i].x+=dx;
                el.points[i].y+=dy;
                pts+=el.points[i].x+','+el.points[i].y+' ';
            }
            el.setAttribute('points',pts);
            console.log(element.points.length+' points adjusted');
            updateGraph(el.id,['points',el.getAttribute('points')]);
            break;
        case 'box':
        case 'text':
        case 'stamp':
            console.log('move by '+dx+','+dy);
            var valX=parseInt(el.getAttribute('x'));
            valX+=dx;
            el.setAttribute('x',valX);
            valY=parseInt(el.getAttribute('y'));
            valY+=dy;
            el.setAttribute('y',valY);
            updateGraph(el.id,['x',valX,'y',valY]);
            break;
        case 'oval':
            console.log('move oval by '+dx+','+dy);
            var valX=parseInt(el.getAttribute('cx'));
            valX+=dx;
            el.setAttribute('cx',valX);
            valY=parseInt(el.getAttribute('cy'));
            valY+=dy;
            el.setAttribute('cy',valY);
            updateGraph(el.id,['cx',valX,'cy',valY]);
            break;
        case 'arc':
            // move centre, start and end points by moveX, moveY
            var d=el.getAttribute('d');
            getArc(d);
            arc.cx+=dx;
            arc.cy+=dy;
            arc.x1+=dx;
            arc.y1+=dy;
            arc.x2+=dx;
            arc.y2+=dy;
            d='M'+arc.cx+','+arc.cy+' M'+arc.x1+','+arc.y1+' A'+arc.r+','+arc.r+' 0 '+arc.major+','+arc.sweep+' '+arc.x2+','+arc.y2;
            updateGraph(el.id,['d',d,'cx',arc.cx,'cy',arc.cy,'x1',arc.x1,'y1',arc.y1,'x2',arc.x2,'y2',arc.y2]);
            el.setAttribute('d',d);
            break;
    }
    setTransform(el); // adjust spin to new position
    refreshNodes(el);
    // MOVE ANY LINKED DIMENSIONS TOO
}
function prompt(text) {
    console.log('PROMPT '+text);
    // re('wind'); // WAS id('undoButton').style.display='none';
    id('prompt').innerHTML=text; //display text for 3 secs
    id('prompt').style.display='block';
    setTimeout(function(){id('prompt').style.display='none'},5000);
}
function re(op) { // op is 're-member' (memorise and show undo), 're-call' (reinstate and hide undo) or 're-wind' (hide undo)
    console.log('re'+op+'; '+selection.length+' selected items; '+memory.length+' memory items');
    if(op=='member') {
        memory=[];
        console.log('REMEMBER');
        for(var i=0;i<selection.length;i++) {
            var elID=selection[i];
            var el=id(elID);
            var props={};
            props.id=elID; // all elements have an id
            switch(type(el)) {
                case 'line':
                case 'shape':
                    var pts='';
                    for(var j=0;j<el.points.length;j++) pts+=el.points[j].x+','+el.points[j].y+' ';
                    props.points=pts;
                    break;
                case 'box':
                    console.log('remember box '+elID);
                    props.x=el.getAttribute('x');
                    props.y=el.getAttribute('y');
                    props.width=el.getAttribute('width');
                    props.height=el.getAttribute('height');
                    props.rx=el.getAttribute('rx');
                    break;
                case 'oval':
                    props.cx=el.getAttribute('cx');
                    props.cy=el.getAttribute('cy');
                    props.rx=el.getAttribute('rx');
                    props.ry=el.getAttribute('ry');
                    break;
                case 'arc':
                    props.d=el.getAttribute('d');
                case 'text':
                case 'stamp':
                    props.x=el.getAttribute('x');
                    props.y=el.getAttribute('y');
                    props.flip=el.getAttribute('flip');
            }
            props.spin=el.getAttribute('spin'); // any element can have spin
            if(props.spin!=0) props.transform=el.getAttribute('transform');
            memory.push(props);
            console.log('selection['+i+']: '+props.id);
        }
        id('styleGroup').style.display='none';
        // id('fill').style.display='none';
        id('undoButton').style.display='block';
        return;
    }
    else if(op=='call') for(var i=0;i<memory.length;i++) { // reinstate from memory
        var item=memory[i];
        console.log('reinstate item '+item.id);
        prompt('UNDO');
        // elID=item.id;
        var el=id(item.id);
        console.log('reinstate '+el.id);
        switch(type(el)) {
            case 'line':
            case 'shape':
                console.log(item.points.length+' points - from '+item.points[0].x+','+item.points[0].y);
                /*
                for(var j=0;j<item.points.length;j++) {
                    el.points[j].x=item.points[j].x;
                    el.points[j].y=item.points[j].y;
                }
                */
                el.setAttribute('points',item.points);
                // el.setAttribute('points',el.getAttribute('points'));
                updateGraph(el.id,['points',el.getAttribute('points'),'spin',item.spin]);
                refreshNodes(el);
                break;
            case 'box':
                console.log('reinstate box element');
                el.setAttribute('x',item.x);
                el.setAttribute('y',item.y);
                el.setAttribute('width',item.width);
                el.setAttribute('height',item.height);
                el.setAttribute('rx',item.rx);
                el.setAttribute('spin',item.spin);
                updateGraph(el.id,['x',item.x,'y',item.y,'spin',item.spin,'flip',item.flip]);
                refreshNodes(el);
                break;
            case 'text':
            case 'stamp':
                el.setAttribute('x',item.x);
                el.setAttribute('y',item.y);
                el.setAttribute('flip',item.flip);
                updateGraph(el.id,['x',item.x,'y',item.y,'spin',item.spin,'flip',item.flip]);
                refreshNodes(el);
                break;
            case 'oval':
                el.setAttribute('cx',item.cx);
                el.setAttribute('cy',item.cy);
                el.setAttribute('rx',item.rx);
                el.setAttribute('ry',item.ry);
                updateGraph (el.id,['cx',item.cx,'cy',item.cy,'rx',item.rx,'ry',item.ry,'spin',item.spin]);
                refreshNodes(el);
                break;
            case 'arc':
                el.setAttribute('d',item.d);
                getArc(item.d);
                updateGraph(el.id,['cx',arc.cx,'cy',arc.cy,'r',arc.r,'x1',arc.x1,'y1',arc.y1,'x2',arc.x2,'y2',arc.y2,'spin',item.spin]);
                refreshNodes(el);
        }
        el.setAttribute('spin',item.spin);
        if(item.transform) el.setAttribute('transform',item.transform)
        else el.setAttribute('transform','rotate(0)');
    }
    id('undoButton').style.display='none';
    id('styleGroup').style.display='block';
}
function refreshNodes(el) {
    // recalculate node.x, node.y after change to element
    console.log('check nodes for el '+el.id);
    if(el==blueline) {
        var points=el.points;
        console.log(points.length+' points in blueline');
        for(var i=0;i<points.length;i++) { // blueline nodes are first 10 in nodes[]
            nodes[i].x=Number(points[i].x);
            nodes[i].y=Number(points[i].y);
            console.log('node '+i+': '+nodes[i].x+','+nodes[i].y);
        }
        return;
    }
    var elNodes=nodes.filter(function(node) {
        return (Math.floor(node.n/10)==Number(el.id));
    });
    console.log('refresh '+elNodes.length+' nodes for element '+el.id);
    var ox=0; // element origin for spin
    var oy=0;
    var r=0; // radius for spin
    var a=0; // angle
    var spin=parseInt(el.getAttribute('spin'));
    switch(type(el)) {
        case 'line':
        case 'shape':
            var points=el.points;
            console.log(points.length+' points');
            ox=Number(points[0].x); // spin around start point
            oy=Number(points[0].y);
            console.log('origin: '+ox+','+oy+' spin: '+spin);
            elNodes[0].x=ox;
            elNodes[0].y=oy;
            if(points.length>elNodes.length) { // adding point
                elNodes.push({'x':0,'y':0}); // initialise new node at 0,0 - will soon be reset
            }
            for(var i=1;i<points.length;i++) {
                if(spin==0) { // no spin
                    elNodes[i].x=Number(points[i].x);
                    elNodes[i].y=Number(points[i].y);
                }
                else { // spin nodes around start point
                    dx=Number(points[i].x)-ox;
                    dy=Number(points[i].y)-oy;
                    console.log('dx:'+dx+' dy:'+dy);
                    a=Math.atan(dy/dx);
                    r=Math.sqrt(dx*dx+dy*dy);
                    a+=(spin*Math.PI/180);
                    console.log('a:'+a+' r:'+r);
                    dx=r*Math.cos(a);
                    dy=r*Math.sin(a);
                    elNodes[i].x=ox+dx;
                    elNodes[i].y=oy+dy;
                }
                console.log('node '+i+': '+elNodes[i].x+','+elNodes[i].y);
            }
            break;
        case 'box':
            x=Number(el.getAttribute('x')); // left
            y=Number(el.getAttribute('y')); // top
            w=Number(el.getAttribute('width'));
            h=Number(el.getAttribute('height'));
            var a=Number(el.getAttribute('spin'));
            a*=Math.PI/180;
            var c=Math.cos(a);
            var s=Math.sin(a);
            console.log(' spin: '+a+' radians cos: '+c+' sine: '+s);
            // spin around centre
            x+=w/2; // centre
            y+=h/2;
            elNodes[0].x=x; // centre
            elNodes[0].y=y;
            elNodes[1].x=x-w*c/2+h*s/2; // top/left
            elNodes[1].y=y-w*s/2-h*c/2;
            elNodes[2].x=x+w*c/2+h*s/2; // top/right
            elNodes[2].y=y+w*s/2-h*c/2;
            elNodes[3].x=x-w*c/2-h*s/2; // bottom/left
            elNodes[3].y=y-w*s/2+h*c/2;
            elNodes[4].x=x+w*c/2-h*s/2; // bottom/right
            elNodes[4].y=y+w*s/2+h*c/2;
            break;
        case 'oval':
            x=Number(el.getAttribute('cx'));
            y=Number(el.getAttribute('cy'));
            var rx=Number(el.getAttribute('rx'));
            var ry=Number(el.getAttribute('ry'));
            var a=Number(el.getAttribute('spin'));
            a*=Math.PI/180;
            var c=Math.cos(a);
            var s=Math.sin(a);
            elNodes[0].x=x; // centre
            elNodes[0].y=y;
            elNodes[1].x=x-rx*c+ry*s; // top/left
            elNodes[1].y=y-rx*s-ry*c;
            elNodes[2].x=x+rx*c+ry*s; // top/right
            elNodes[2].y=y+rx*s-ry*c;
            elNodes[3].x=x-rx*c-ry*s; // bottom/left
            elNodes[3].y=y-rx*s+ry*c;
            elNodes[4].x=x+rx*c-ry*s; // bottom/right
            elNodes[4].y=y+rx*s+ry*c;
            break;
        case 'arc':
            var d=el.getAttribute('d');
            console.log('arc path: '+d);
            elNodes[0].x=arc.cx; // centre
            elNodes[0].y=arc.cy;
            elNodes[1].x=arc.x1; // start point
            elNodes[1].y=arc.y1;
            elNodes[2].x=arc.x2; // end point
            elNodes[2].y=arc.y2;
            console.log('arc centre node: '+elNodes[0].x+','+elNodes[0].y);
            break;
        case 'stamp':
            elNodes[0].x=Number(el.getAttribute('ax'));
            elNodes[0].y=Number(el.getAttribute('ay'));
            break;
    }
    // checkDims(el); // check if any dimensions need refreshing
}
function remove(elID,keepNodes) {
    console.log('remove element '+elID);
    var el=id(elID);
    var ptn=id('pattern'+elID); // remove any associated pattern
    if(ptn) ptn.remove(); 
    var request=db.transaction('graphs','readwrite').objectStore('graphs').delete(Number(elID));
    request.onsuccess=function(event) {
        el.remove();
        console.log('element removed');
    }
 	request.onerror=function(event) {
	    console.log("error deleting element "+el.id);
	};
}
function reset() {
    zoom=1; // establish zoom level to fit drawing to screen
    var ok=false;
    while (ok==false) {
        w=(scr.w*f/zoom)/dwg.w;
        h=(scr.h*f/zoom)/dwg.h;
        if((w<1)||(h<1)) zoom/=2;
        else if((w>2)&&(h>2)) zoom*=2;
        else ok=true;
    }
    console.log('full-drawing-zoom: '+zoom);
    w=scr.w*f/zoom; // WAS w=dwg.w/zoom;
    h=scr.h*f/zoom; // WAS h=dwg.h/zoom;
    console.log('set viewbox to '+w+'x'+h);
    view.x=view.y=0;
    view.w=w;
    view.h=h;
    view.box="0 0 "+w+" "+h; 
    id('background').setAttribute('viewBox',view.box);
    id('svg').setAttribute('viewBox',view.box);
    id('zoom').innerHTML=zoom;
}
function select(el,multiple) {
	if(multiple) { // one of multiple selection - highlight in blue
		console.log('select element '+el.id+' of multiple selection');
		var box=getBounds(el);
		var html="<rect x='"+box.x+"' y='"+box.y+"' width='"+box.width+"' height='"+box.height+"' ";
		html+="stroke='none' fill='blue' fill-opacity='0.25' el='"+el.id+"'/>";
		console.log('box html: '+html);
		id('selection').innerHTML+=html; // blue block for this element
	}
	else {
		console.log('select '+el.id+' stroke: '+el.getAttribute('stroke')+' fill: '+el.getAttribute('fill'));
		// TRY WITHOUT setStyle(el); // set style to suit selected element
		// add node markers, boxes and handles to single selected item
		id('handles').innerHTML=''; // clear any handles then add handles for selected element 
		// first draw node markers?
		for(var i=0;i<nodes.length;i++) { // draw tiny circle at each node
			if(Math.floor(nodes[i].n/10)!=el.id) continue;
			var html="<circle cx='"+nodes[i].x+"' cy='"+nodes[i].y+"' r='"+1+"'/>";
			console.log('node at '+nodes[i].x+','+nodes[i].y);
			id('handles').innerHTML+=html;
		}
		switch(type(el)) {
			case 'sketch':
				var graphs=db.transaction('graphs','readwrite').objectStore('graphs');
				var request=graphs.get(Number(el.id));
				request.onsuccess=function(event) {
					var graph=request.result;
					console.log('got graph '+graph.id);
					var pts=graph.points;
					el.points=graph.points;
					console.log(el.points.length+' points');
					for(var q=0;q<el.points.length;q++) {
						console.log('point '+q+': '+el.points[q].x+','+el.points[q].y);
					}
					var points='';
					for(var i=0;i<graph.points.length;i++) points+=pts[i].x+','+pts[i].y+' ';
					id('bluePolyline').setAttribute('points',points);
					var html="<use id='mover0' href='#mover' x='"+pts[0].x+"' y='"+pts[0].y+"'/>";
					id('handles').innerHTML+=html; // circle handle moves whole element
					for(var i=1;i<pts.length;i++) {
						html="<use id='sizer"+i+"' href='#sizer' x='"+pts[i].x+"' y='"+pts[i].y+"'/>";
						id('handles').innerHTML+=html; // disc handles move remaining nodes
					}
				}
				id('guides').style.display='block';
				prompt('SKETCH');
				node=0; // default anchor node
				mode='pointEdit';
				break;
			case 'line':
	        case 'shape':
	            var points=el.points;
	            var n=points.length;
	            // draw handles
				var html="<use id='mover0' href='#mover' x='"+points[0].x+"' y='"+points[0].y+"'/>";
				id('handles').innerHTML+=html; // circle handle moves whole element
				for(var i=1;i<n;i++) {
					html="<use id='sizer"+i+"' href='#sizer' x='"+points[i].x+"' y='"+points[i].y+"'/>";
					id('handles').innerHTML+=html; // disc handles move remaining nodes
				}
				id('bluePolyline').setAttribute('points',el.getAttribute('points'));
				id('guides').style.display='block';
				prompt((type(el)=='line')?'LINE':'SHAPE');
				node=0; // default anchor node
				mode='pointEdit';
				break;
			case 'box':
				x=parseFloat(el.getAttribute('x'));
				y=parseFloat(el.getAttribute('y'));
				w=parseFloat(el.getAttribute('width'));
				h=parseFloat(el.getAttribute('height'));
				// draw blueBox for sizing
				id('blueBox').setAttribute('x',x); // SET blueBox TO MATCH BOX (WITHOUT SPIN)
				id('blueBox').setAttribute('y',y);
				id('blueBox').setAttribute('width',w);
				id('blueBox').setAttribute('height',h);
				id('guides').style.display='block';
				// draw handles
				var html="<use id='mover0' href='#mover' x='"+(x+w/2)+"' y='"+(y+h/2)+"'/>"; // center
				html+="<use id='sizer1' href='#sizer' x='"+x+"' y='"+y+"'/>"; // top/left
				html+="<use id='sizer2' href='#sizer' x='"+(x+w)+"' y='"+y+"'/>"; // top/right
				html+="<use id='sizer3' href='#sizer' x='"+x+"' y='"+(y+h)+"'/>"; // bottom/left
				html+="<use id='sizer4' href='#sizer' x='"+(x+w)+"' y='"+(y+h)+"'/>"; // bottom/right
				id('handles').innerHTML+=html;
				node=0; // default anchor node
				mode='edit';
				break;
			case 'oval':
				x=parseFloat(el.getAttribute('cx'));
				y=parseFloat(el.getAttribute('cy'));
				w=parseFloat(el.getAttribute('rx'))*2;
				h=parseFloat(el.getAttribute('ry'))*2;
				// draw blueBox for sizing
				id('blueBox').setAttribute('x',(x-w/2)); // SET blueBox TO MATCH OVAL (WITHOUT SPIN)
				id('blueBox').setAttribute('y',(y-h/2));
				id('blueBox').setAttribute('width',w);
				id('blueBox').setAttribute('height',h);
				id('guides').style.display='block';
				// draw handles
				var html="<use id='mover0' href='#mover' x='"+x+"' y='"+y+"'/>"; // center
				html+="<use id='sizer1' href='#sizer' x='"+(x-w/2)+"' y='"+(y-h/2)+"'/>"; // top/left
				html+="<use id='sizer2' href='#sizer' x='"+(x+w/2)+"' y='"+(y-h/2)+"'/>"; // top/right
				html+="<use id='sizer3' href='#sizer' x='"+(x-w/2)+"' y='"+(y+h/2)+"'/>"; // bottom/left
				html+="<use id='sizer4' href='#sizer' x='"+(x+w/2)+"' y='"+(y+h/2)+"'/>"; // bottom/right
				id('handles').innerHTML+=html;
				node=0; // default anchor node
				mode='edit';
				break;
			case 'arc':
				var d=el.getAttribute('d');
				console.log('select arc - d: '+d);
				getArc(d); // derive arc geometry from d
				// draw handles
				var html="<use id='mover0' href='#mover' x='"+arc.cx+"' y='"+arc.cy+"'/>"; // mover at centre
				html+="<use id='sizer1' href='#sizer' x='"+arc.x1+"' y='"+arc.y1+"'/>"; // sizers at start...
				html+="<use id='sizer2' href='#sizer' x='"+arc.x2+"' y='"+arc.y2+"'/>"; // ...and end or arc
				id('handles').innerHTML+=html;
				var a1=Math.atan((arc.y1-arc.cy)/(arc.x1-arc.cx));
				if(arc.x1<arc.cx) a1+=Math.PI;
				var a=Math.atan((arc.y2-arc.cy)/(arc.x2-arc.cx));
				console.log('end angle: '+a);
				if(arc.x2<arc.cx) a+=Math.PI;
				x0=arc.cx; // centre
				y0=arc.cy;
				x=x0+arc.r*Math.cos(a); // end point
				y=y0+arc.r*Math.sin(a);
				a=Math.abs(a-a1); // swept angle - radians
				a*=180/Math.PI; // degrees
				a=Math.round(a);
				if(arc.major>0) a=360-a;
				prompt('ARC');
				mode='edit';
				break;
			case 'text':
				var bounds=el.getBBox();
				w=Math.round(bounds.width);
				h=Math.round(bounds.height);
				// draw handle
				var html="<use id='mover0' href='#mover' x='"+bounds.x+"' y='"+(bounds.y+h)+"'/>";
				id('handles').innerHTML+=html; // circle handle moves text
				// show text edit dialog
				id('textDialog').style.left='48px';
				id('textDialog').style.top='4px';
				id('text').value=element.innerHTML;
				id('textDialog').style.display='block';
				mode='edit';
				break;
			case 'stamp':
				var bounds=getBounds(el);
				x=Number(el.getAttribute('x'));
				y=Number(el.getAttribute('y'));
				w=Number(bounds.width);
				h=Number(bounds.height);
				// draw handle
				var html="<use id='mover0' href='#mover' x='"+x+"' y='"+y+"'/>";
				id('handles').innerHTML=html;
				prompt('STAMP');
				mode='edit';
				break;
		};
	}
}
function setButtons() {
    var n=selection.length;
    console.log('set buttons for '+n+' selected elements');
    var active=[3,9]; // active buttons - remove & move always active
    // childNodes of editTools are... 0:add 1:remove 2:forward 3:back 4:move 5:spin 6:flip 7:align 8:double 9:repeat 10:fillet 11: define
    if(n>1) { // multiple selection
        active.push(15); // align active for multiple selection
        active.push(23);
    }
    else { // single element selected
        var t=type(id(selection[0]));
        // console.log('selected element is '+t);
        if((t=='line')||(t=='shape')) active.push(1); // can add points to selected line/shape
        else if(t=='box') active.push(21); // fillet tool active for a selected box
        if(selectedPoints.length<1) { // unless editing line/shape active tools include...
            active.push(5); // push/pull back/forwards
            active.push(7);
            active.push(11); // spin and flip
            active.push(13);
            active.push(17); // double, repeat and anchor
            active.push(19);
            active.push(23);
        } 
    }
    var set='';
    for(i=0;i<active.length;i++) set+=active[i]+' ';
    // console.log(active.length+' edit tools active: '+set);
    var n=id('editTools').childNodes.length;
    for(var i=0;i<n;i++) {
        var btn=id('editTools').childNodes[i];
        // console.log(i+' '+btn.id+': '+(active.indexOf(i)>=0));
        id('editTools').childNodes[i].disabled=(active.indexOf(i)<0);
    }
}
function setLineStyle(g) {
    if(g.lineStyle=='dashed') return (4*g.lineW)+" "+(4*g.lineW);
    else if(g.lineStyle=='dotted') return g.lineW+" "+g.lineW;
    // else return null;
}
function setStyle() {
	var el=(selection.length>0)?id(selection[0]):null;
    if(!el ||(type(el)=='stamp')) { // no element/stamp - show default styles
        id('lineType').value=lineType;
        id('line').style.borderBottomStyle=lineType;
        console.log('set line width to '+lineW);
        id('lineWidth').value=lineW;
        id('line').style.borderWidth=lineW+'px';
        id('lineCol').value=lineCol;
        id('line').style.borderColor=lineCol;
        id('fill').style.color=lineCol;
        id('textFont').value=textFont;
        id('fill').style.fontFamily=textFont;
        id('textStyle').value=textStyle;
        id('textSize').value=textSize;
        id('fill').style.fontSize=(textSize*2)+'pt';
        id('fillType').value=fillType;
        id('patternOption').disabled=true;
        id('fill').style.backgroundColor=fillCol;
        id('fillCol').value=fillCol;
        id('fill').style.fontStyle=(textStyle=='italic')?'italic':'normal';
        id('fill').style.fontWeight=(textStyle=='bold')?'bold':'normal';
        id('line').style.opacity=opacity;
        id('fill').style.opacity=opacity;
        id('opacity').value=opacity;
        id('blur').value=blur;
    }
    else { // show styles for element el
        console.log('SET STYLES FOR ELEMENT '+el.id);
        id('line').style.borderBottomStyle=val;
        var val=el.getAttribute('stroke-width');
        console.log('line width: '+val);
        if(val) {
            console.log('line width: '+val);
            // id('line').style.borderWidth=(val)+'px';
            // val=Math.floor(val/4);
            // if(val>3) val=3;
            // console.log('select option '+val);
            id('lineWidth').value=val;
        }
        val=el.getAttribute('stroke');
        console.log('stroke: '+val);
        if(val) {
            id('lineCol').value=val;
            // id('line').style.borderColor=val;
        }
        val=getLineStyle(el);
        console.log('line type: '+val);
        id('lineType').value=val;
        id('patternOption').disabled=false;
        val=el.getAttribute('fill');
        console.log('element '+el.getAttribute('id')+' fill: '+val);
        if(type(element)=='text') {
			id('lineCol').value=val;
			id('fillType').value='none';
		}
        else if(val.startsWith('url')) {
        	id('fillType').value='pattern';
        	id('fillCol').value=id('pattern'+el.id).firstChild.getAttribute('fill');
        }
        else if(val=='none') {id('fillType').value='none';}
        else {
        	id('fillType').value='solid';
        	id('fillCol').value=val;
        }
        val=el.getAttribute('fill-opacity');
        if(val) {
            id('opacity').value=val;
            // id('fill').style.opacity=val;
        }
        else id('opacity').value=1;
        val=el.getAttribute('filter');
        if(val) {
            val=parseInt(val.charAt(9)); // url(#blurN)
            id('blur').value=val;
            console.log('SET BLUR TO '+val);
        }
        else id('blur').value=0;
        if(type(element)=='text') {
            val=el.getAttribute('font-family');
            console.log('font: '+val);
            id('textFont').value=val;
            val=el.getAttribute('font-size');
            id('textSize').value=val;
            id('textStyle').value='fine';
            id('fill').style.fontStyle='normal';
            val=el.getAttribute('font-style');
            if(val=='italic') {
                id('textStyle').value='italic';
                // id('text').style.fontStyle='italic';
            }
            val=el.getAttribute('font-weight');
            if(val=='bold') {
                id('textStyle').value='bold';
                // id('text').style.fontWeight='bold';
            }
        } 
    }
}
function setTransform(el) {
    console.log('set transform for element '+el.id);
    var spin=parseInt(el.getAttribute('spin'));
    var flip=el.getAttribute('flip');
    console.log('set spin to '+spin+' degrees and flip to '+flip+' for '+type(el));
    switch(type(el)) {
        case 'line':
        case 'shape':
            x=parseInt(el.points[0].x);
            y=parseInt(el.points[0].y);
            break;
        case 'box':
            x=parseInt(el.getAttribute('x'))+parseInt(el.getAttribute('width'))/2;
            y=parseInt(el.getAttribute('y'))+parseInt(el.getAttribute('height'))/2;
            break;
        case 'text':
        case 'stamp':
            x=parseInt(el.getAttribute('x'));
            y=parseInt(el.getAttribute('y'));
            break;
        case 'oval':
        case 'arc':
            x=parseInt(el.getAttribute('cx'));
            y=parseInt(el.getAttribute('cy'));
    }
    var t='';
    if(flip) {
        var hor=flip&1;
        var ver=flip&2;
        t='translate('+(hor*x*2)+','+(ver*y)+') ';
        t+='scale('+((hor>0)? -1:1)+','+((ver>0)? -1:1)+')';
    }
    if(spin!=0) t+='rotate('+spin+','+x+','+y+')';
    el.setAttribute('transform',t);
    refreshNodes(el);
}
function showDialog(dialog,visible) {
    console.log('show dialog '+dialog);
    if(visible) id('prompt').style.display='none';
    if(currentDialog) id(currentDialog).style.display='none'; // hide any currentDialog
    id(dialog).style.display=(visible)?'block':'none'; // show/hide dialog
    currentDialog=(visible)?dialog:null; // update currentDialog
    // console.log('current dialog: '+currentDialog);
}
function showEditTools(visible) {
    if(visible) {
        id('tools').style.display='none';
        id('editTools').style.display='block';
    }
    else {
        id('editTools').style.display='none';
        id('tools').style.display='block';
    }
}
function sketchPath(pts) {
	console.log('get path for points: '+pts);
    // console.log(pts.length+' points');
	var d='M'+pts[0].x+','+pts[0].y; // move to point 0
	if(pts.length<3) d+=' L'+pts[1].x+','+pts[1].y; // 2 points - short straight line
	else {
	    var n=7; // vary n to adjust smoothness of curve - 7 seems a good compromise
	    var c1={}; // control points
	    var c2={};
	    dx=pts[2].x-pts[0].x; // position control points parallel to chord of flanking points
	    dy=pts[2].y-pts[0].y; // this is for point 1
	    c2.x=pts[1].x-dx/n; // first control point
	    c2.y=pts[1].y-dy/n;
	    d+=' Q'+c2.x+','+c2.y+' '+pts[1].x+','+pts[1].y; // first segment - quadratic curve
	    // console.log('point 1 path: '+d);
	    var i=2;
	    while(i<pts.length-1) { // intermediate segments
	        c1.x=pts[i-1].x+dx/n; // reflect previous control point
	        c1.y=pts[i-1].y+dy/n;
	        dx=pts[i+1].x-pts[i-1].x;
	        dy=pts[i+1].y-pts[i-1].y;
	        c2.x=pts[i].x-dx/n; // next control point
	        c2.y=pts[i].y-dy/n;
	        d+=' C'+c1.x+','+c1.y+' '+c2.x+','+c2.y+' '+pts[i].x+','+pts[i].y; // cubic curves
	        // console.log('point '+i+': '+d);
	        i++
	    }
	    c1.x=pts[i-1].x+dx/n;
	    c1.y=pts[i-1].y+dy/n;
	    d+=' S'+c1.x+','+c1.y+' '+pts[i].x+','+pts[i].y; // final segment - smooth cubic curve
	}
	// console.log('final path: '+d);
	return d;
}
function snapCheck() {
    var near=nodes.filter(function(node) {
        return (Math.abs(node.x-x)<snapD)&&(Math.abs(node.y-y)<snapD);
    });
    if(near.length) { // snap to nearest node...
        var min=snapD*2;
        for(var i=0;i<near.length;i++) {
            var d=Math.abs(near[i].x-x)+Math.abs(near[i].y-y);
            if(d<min) {
                min=d;
                snap={'x':near[i].x,'y':near[i].y,'n':near[i].n};
            }
        }
        console.log('SNAP x: '+snap.x+' y: '+snap.y+' n: '+snap.n);
        x=snap.x;
        y=snap.y;
        return snap;
    }
    else { // if no nearby nodes...
    	// console.log('no nearby nodes gridSnap is '+gridSnap);
        if(gridSnap>0) {
        	x=Math.round(x/gridSize)*gridSize;
        	y=Math.round(y/gridSize)*gridSize;
        }
        return false;
    }
}
function swopGraphs(g1,g2) {
    console.log('swop graphs '+g1+' and '+g2);
    g1=Number(g1);
    g2=Number(g2);
    var graph1={};
    var graph2={};
    var transaction=db.transaction('graphs','readwrite');
    var graphs=transaction.objectStore('graphs');
    var request=graphs.get(g1);
    request.onsuccess=function(event) {
        graph1=request.result;
        console.log('got graph: '+graph1.id);
        request=graphs.get(g2);
        request.onsuccess=function(event) {
            graph2=request.result;
            console.log('got graph: '+graph2.id);
            var tempID=graph1.id;
            graph1.id=graph2.id;
            graph2.id=tempID;
            console.log('IDs swopped');
            request=graphs.put(graph1);
            request.onsuccess=function(event) {
                console.log('g1 saved');
                request=graphs.put(graph2);
                request.onsuccess=function(event) {
                    console.log('g2 saved');
                }
            }
        }
        request.onerror=function(event) {
            console.log('error getting graph2 to swop');
        }
    }
    request.onerror=function(event) {
        console.log('error getting graph1 to swop');
    }
    transaction.oncomplete=function(event) {
        console.log('swop complete');
    }
}
function type(el) {
    if(el instanceof SVGPolylineElement) {
        return 'line';
    }
    else if(el instanceof SVGPolygonElement) {
        return'shape';
    }
    else if(el instanceof SVGRectElement) {
        return 'box';
    }
    else if(el instanceof SVGEllipseElement) {
        return 'oval';
    }
    else if(el instanceof SVGPathElement) {
        var d=el.getAttribute('d');
        if(d.indexOf('A')>0) return 'arc';
        else return 'sketch';
    }
    else if(el instanceof SVGTextElement) {
        return 'text';
    }
    else if(el instanceof SVGGElement) {
        return 'dim';
    }
    else if(el instanceof SVGSVGElement) {
        return 'stamp';
    }
    else if(el instanceof SVGCircleElement) {
        return 'anchor';
    }
    else if(el instanceof SVGUseElement) {
        return 'stamp';
    }
}
function updateGraph(id,parameters) {
    // console.log('adjust '+attribute+' of graph '+id+' to '+val);
	var graphs=db.transaction('graphs','readwrite').objectStore('graphs');
	var request=graphs.get(Number(id));
	request.onsuccess=function(event) {
	    var graph=request.result;
	    console.log('got graph '+graph.id);
	    while(parameters.length>0) {
	        var attribute=parameters.shift();
	        val=parameters.shift();
	        console.log('set '+attribute+' to '+val);
	        eval('graph.'+attribute+'="'+val+'"');
	    }
	    request=graphs.put(graph);
	        request.onsuccess=function(event) {
			    console.log('graph '+id+' updated');
		};
		request.onerror=function(event) {
		    console.log("PUT ERROR updating graph "+id);
		};
	}
	request.onerror=function(event) {console.log('error updating '+id);};
}
// START-UP CODE
var request=window.indexedDB.open("miroDB",dbVersion);
request.onsuccess=function(event) {
    db=event.target.result;
    load();
};
request.onupgradeneeded=function(event) {
    var db=event.target.result;
    if (!db.objectStoreNames.contains('graphs')) {
        var graphs=db.createObjectStore('graphs',{keyPath:'id',autoIncrement:true});
    }
    if (!db.objectStoreNames.contains('stamps')) {
        var stamps=db.createObjectStore("stamps",{keyPath:'name'});
    }
    /* if (!db.objectStoreNames.contains('images')) {
        var stamps=db.createObjectStore("images",{keyPath:'id',autoIncrement:true});
    } */
};
request.onerror=function(event) {
	alert("indexedDB error");
};
// SERVICE WORKER
if (navigator.serviceWorker.controller) {
	console.log('Active service worker found, no need to register')
}
else { //Register the ServiceWorker
	navigator.serviceWorker.register('miroSW.js').then(function(reg) {
		console.log('Service worker has been registered for scope:'+ reg.scope);
	});
}
var pattern=[];
pattern[0]={'width':4, 'height':2, 'spin':0, 'svg':'<rect x="0" y="1" width="4" height="0.5" stroke="none"/>'};
pattern[1]={'width':4, 'height':2, 'spin':0, 'svg':'<rect x="0" y="1" width="4" height="1" stroke="none"/>'};
pattern[2]={'width':4, 'height':4, 'spin':0, 'svg':'<rect x="0" y="2" width="4" height="2" stroke="none"/>'};
pattern[3]={'width':4, 'height':2, 'spin':90, 'svg':'<rect x="0" y="1" width="4" height="0.5" stroke="none"/>'};
pattern[4]={'width':4, 'height':2, 'spin':90, 'svg':'<rect x="0" y="1" width="4" height="1" stroke="none"/>'};
pattern[5]={'width':4, 'height':4, 'spin':90, 'svg':'<rect x="0" y="2" width="4" height="2" stroke="none"/>'};
pattern[6]={'width':4, 'height':2, 'spin':-45, 'svg':'<rect x="0" y="1" width="4" height="0.5" stroke="none"/>'};
pattern[7]={'width':4, 'height':2, 'spin':-45, 'svg':'<rect x="0" y="1" width="4" height="1" stroke="none"/>'};
pattern[8]={'width':4, 'height':4, 'spin':-45, 'svg':'<rect x="0" y="2" width="4" height="2" stroke="none"/>'};
pattern[9]={'width':4, 'height':2, 'spin':45, 'svg':'<rect x="0" y="1" width="4" height="0.5" stroke="none"/>'};
pattern[10]={'width':4, 'height':2, 'spin':45, 'svg':'<rect x="0" y="1" width="4" height="1" stroke="none"/>'};
pattern[11]={'width':4, 'height':4, 'spin':45, 'svg':'<rect x="0" y="2" width="4" height="2" stroke="none"/>'};
pattern[12]={'width':2, 'height':2, 'spin':0, 'svg':'<rect x="0" y="1" width="2" height="0.5" stroke="none"/><rect x="1" y="0" width="0.5" height="2" stroke="none"/>'};
pattern[13]={'width':2, 'height':2, 'spin':0, 'svg':'<rect x="0" y="1" width="2" height="1" stroke="none"/><rect x="1" y="0" width="1" height="2" stroke="none"/>'};
pattern[14]={'width':4, 'height':4, 'spin':0, 'svg':'<rect x="0" y="2" width="4" height="2" stroke="none"/><rect x="2" y="0" width="2" height="4" stroke="none"/>'};
pattern[15]={'width':2, 'height':2, 'spin':45, 'svg':'<rect x="0" y="1" width="2" height="0.5" stroke="none"/><rect x="1" y="0" width="0.5" height="2" stroke="none"/>'};
pattern[16]={'width':2, 'height':2, 'spin':45, 'svg':'<rect x="0" y="1" width="2" height="1" stroke="none"/><rect x="1" y="0" width="1" height="2" stroke="none"/>'};
pattern[17]={'width':4, 'height':4, 'spin':45, 'svg':'<rect x="0" y="2" width="4" height="2" stroke="none"/><rect x="2" y="0" width="2" height="4" stroke="none"/>'};
pattern[18]={'width':1, 'height':1, 'spin':0, 'svg':'<rect x="0.25" y="0.25" width="0.5" height="0.5" stroke="none"/>'};
pattern[19]={'width':2, 'height':2, 'spin':0, 'svg':'<rect x="0.5" y="0.5" width="1" height="1" stroke="none"/>'};
pattern[20]={'width':4, 'height':4, 'spin':0, 'svg':'<rect x="0" y="0" width="3" height="3" stroke="none"/>'};
pattern[21]={'width':1, 'height':1, 'spin':45, 'svg':'<rect x="0.25" y="0.25" width="0.5" height="0.5" stroke="none"/>'};
pattern[22]={'width':2, 'height':2, 'spin':45, 'svg':'<rect x="0.5" y="0.5" width="1" height="1" stroke="none"/>'};
pattern[23]={'width':4, 'height':4, 'spin':45, 'svg':'<rect x="0" y="0" width="3" height="3" stroke="none"/>'};
pattern[24]={'width':1, 'height':1, 'spin':0, 'svg':'<rect x="0" y="0" width="0.5" height="0.5" stroke="none"/><rect x="0.5" y="0.5" width="0.5" height="0.5" stroke="none"/>'};
pattern[25]={'width':2, 'height':2, 'spin':0, 'svg':'<rect x="0" y="0" width="1" height="1" stroke="none"/><rect x="1" y="1" width="1" height="1" stroke="none"/>'};
pattern[26]={'width':4, 'height':4, 'spin':0, 'svg':'<rect x="0" y="0" width="2" height="2" stroke="none"/><rect x="2" y="2" width="2" height="2" stroke="none"/>'};
pattern[27]={'width':1, 'height':1, 'spin':45, 'svg':'<rect x="0" y="0" width="0.5" height="0.5" stroke="none"/><rect x="0.5" y="0.5" width="0.5" height="0.5" stroke="none"/>'};
pattern[28]={'width':2, 'height':2, 'spin':45, 'svg':'<rect x="0" y="0" width="1" height="1" stroke="none"/><rect x="1" y="1" width="1" height="1" stroke="none"/>'};
pattern[29]={'width':4, 'height':4, 'spin':45, 'svg':'<rect x="0" y="0" width="2" height="2" stroke="none"/><rect x="2" y="2" width="2" height="2" stroke="none"/>'};
pattern[30]={'width':1, 'height':1, 'spin':0, 'svg':'<circle cx="0.5" cy="0.5" r="0.25" stroke="none"/>'};
pattern[31]={'width':2, 'height':2, 'spin':0, 'svg':'<circle cx="1" cy="1" r="0.5" stroke="none"/>'};
pattern[32]={'width':4, 'height':4, 'spin':0, 'svg':'<circle cx="2" cy="2" r="1" stroke="none"/>'};
pattern[33]={'width':1, 'height':1, 'spin':45, 'svg':'<circle cx="0.5" cy="0.5" r="0.25" stroke="none"/>'};
pattern[34]={'width':2, 'height':2, 'spin':45, 'svg':'<circle cx="1" cy="1" r="0.5" stroke="none"/>'};
pattern[35]={'width':4, 'height':4, 'spin':45, 'svg':'<circle cx="2" cy="2" r="1" stroke="none"/>'};

