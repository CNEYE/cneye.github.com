KISSY.add('mui/ipixel',function(){

	//遍历 pix 数组
	function mappix(imageData,fn){
		var	data = imageData.data,
			idx =0,item;
		for(var i=0,r,len=data.length;i<len;i+=4){
			if(r = fn(data[i],data[i+1],
					data[i+2],data[i+3],i)){
				data[i]=r[0];
				data[i+1]=r[1];
				data[i+2]=r[2];
				data[i+3]=r[3];
			}
		}
	}
	function pos2index(index,width){
		var x,y,
			wid = width * 4;
		
		x = index % wid;
		y = Math.floor(index / wid);
		
		return {x:x,y:y}
	}
	function getrgba(imageData,width,x,y){
		var wid = width * 4,
			index = y * wid + x;
		
		return {
			r: imageData.data[index],
			g: imageData.data[index+1],
			b: imageData.data[index+2],
			a: imageData.data[index+3],
			index: index
		}
	}
	//遍历算法
	function traverse(imageData,index,width,height,dep,filter){
		
		var vidx=pos2index(index,width),
			retval = {
				T:  {index:{x:vidx.x,y:vidx.y},queue:[],rule:[0,-1]/*[x:offset,y:offset]*/},
				TL: {index:{x:vidx.x,y:vidx.y},queue:[],rule:[-1,-1]},
				TR: {index:{x:vidx.x,y:vidx.y},queue:[],rule:[1,-1]},
				L:  {index:{x:vidx.x,y:vidx.y},queue:[],rule:[-1,0]},
				R:  {index:{x:vidx.x,y:vidx.y},queue:[],rule:[1,0]},
				BL: {index:{x:vidx.x,y:vidx.y},queue:[],rule:[-1,1]},
				B:  {index:{x:vidx.x,y:vidx.y},queue:[],rule:[0,1]},
				BR: {index:{x:vidx.x,y:vidx.y},queue:[],rule:[1,1]},
				C:  {index:{x:vidx.x,y:vidx.y}}
			},
			depth = dep || 1,
		    rele,item,wid=width*4;

		while ( depth-- ) {
			for(var p in retval){
				if ( (item=retval[p]) && (rule = item['rule']) ) {
					var x = (item.index.x+=(rule[0]*4));
					var y = (item.index.y+=(rule[1]));

					if (!(x<0 || y<0 || x> wid || y>height)){
						var rgb = getrgba(imageData,width,x,y);
							item.queue.push(rgb);
							filter && filter(rgb);
					}
				}
			}		
		}
		return retval;
	};

	return {
		//边缘提取算法
		fringe: function(canvas,imageData,dep,ctx){
			var context = ctx || canvas.getContext('2d'),
				rdata=[],
				width = canvas.width,
				height = canvas.height,
				depth  = dep || 8;
			
			if ( !imageData ){
				imageData = context.getImageData(0,0,width,height);
			}

			mappix(imageData,function(r,g,b,a,index){
				if ( (r != 255 && g!==255 && b!=255) && a!==0) {

					var walk = traverse(imageData,index,width,height,depth,function(rgb){
							if (!(rgb.r==255 && rgb.b==255&&rgb.g==255)){
								imageData.data[rgb.index] = imageData.data[rgb.index+1] 
									= imageData.data[rgb.index+2]=imageData.data[rgb.index+3] = 255;
								rgb.r = rgb.b = rgb.g =0;
							} 
						}),
						rhas255 = false;
					for(var p in walk) {
						if (p !=='C' && walk[p].queue.length && walk[p].queue[0].r == 255) {
							rhas255 = true;
							rdata.push([walk.C.index.x/4,walk.C.index.y]);
							break;
						}
					}
					return rhas255 ? [255,0,0,255] :[r,g,b,0];
				}
				return [r,g,b,0]
			});
			
			return {imageData: imageData,coordinate:rdata};
		}
	}
});

KISSY.add('mui/firemaker',function(S,Ipixel){
	
	var $ = S.Node.all;

	function Firemakder(canvas,config){
		
		this.initalize(canvas,config);
	}
	return S.augment(Firemakder,{
		initalize: function(canvas,config){
			this.canvas = $(canvas);
			this.context = this.canvas[0].getContext('2d');

			this.width = this.canvas.width();
			this.height = this.canvas.height();

			this.config = S.mix({
				//画笔颜色
				pencolor: 'rgba(249,135,95,1)',
				//画笔尺寸
				pensize: 8
			},config);
			
			this.bindEvent(this);
			this.candraw = true;
		},
		bindEvent: function(that){

			that.canvas.on('mousedown',function(e){
				if (e.button==0){
					that.down(e);
				}
			})
		},
		//回话相关函数
		down: function(e){
			var that = this;
			//标记笔的坐标
			that.penX = e.pageX;
			that.penY = e.pageY;
			that.offset = that.canvas.offset();
			//如果不能绘制就直接返回
			if ( !that.candraw ) {
				return ;
			}

			//设置默认样式
			
			S.mix(that.context,{
				strokeStyle: that.config.pencolor,
				lineWidth: that.config.pensize,
				lineCap: 'round',
				lineJoin: 'round'
			});

			$(document).on('mousemove',that._movehandler= function(e){
				that.move(e);
				}).on('mouseup',that._uphandler=function(e){
				that.up(e);
			});
			that.starting = false;
		},
		move: function(e){
			var cxt = this.context,
				offset = this.offset,
				bx = this.penX-offset.left,
				by = this.penX -offset.top;

			if ( !this.starting ){
				this.fire('drawstart');
				this.starting = true;
			}

			cxt.beginPath();
			cxt.moveTo(this.penX-offset.left,this.penY-offset.top);
			cxt.lineTo((this.penX=e.pageX)-offset.left,(this.penY=e.pageY)-offset.top);
			cxt.stroke();
			cxt.closePath();

			this.fire('draw drawing',{event:e});
		},
		up: function(){
			$(document).detach('mousemove',this._movehandler);
			$(document).detach('mouseup',this._uphandler);
			this.fire('drawend');
		},
		clearRect: function(){
			var canvas = this.canvas[0];
				canvas.width = this.width;
			
			this.fire('clearRect draw');
		},
		//禁止画图开关
		disabled: function(){
			this.candraw = !this.candraw;
		},

		copy: function(tcanvas){
			var canvas = $(tcanvas)[0],
				cxt = canvas.getContext('2d');

			cxt.drawImage(this.canvas[0],0,0,this.width,
				this.height,0,0,canvas.width=canvas.width,canvas.height);	
		},
		//获取播放点矩阵
		point: function(){
			//var imageData = Ipixel.threshoding(this.canvas[0],2);
			var data = Ipixel.fringe(this.canvas[0],null,12);
			return data.coordinate;
		},
		image: function(src,offset,realWidth,realHeight){

			var image = new Image,
				that = this;

			image.onload = function(){
				that.drawImage(image,offset,realWidth,realHeight);
				image.onload = image.onerror = null;
			}
			image.onerror = function(){
				S.log('image load error!');
				image.onload = image.onerror = null;
			}
			image.src = src;
		},
		drawImage: function(image,offset,realWidth,realHeight){
			var width =image.width,
				height = image.height,
				left =0 ,top = 0;

			realWidth = realWidth || width;
			realHeight = realHeight || height;

			if (true === offset){
				left = (this.width - realWidth) /2;
				top = (this.height -realHeight) /2;
			} else if (S.isPlainObject(offset)){
				left = offset.left;
				top = offset.top;
			}

			this.context.drawImage(image,0,0,width,height,
					left,top,realWidth,realHeight);
			this.fire('drawImage draw');
		}
	},S.Event.Target)
},{
	requires: ['mui/ipixel']
});