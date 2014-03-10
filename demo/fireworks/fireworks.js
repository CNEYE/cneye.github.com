/*
 * 烟花格式播放
 */

 KISSY.add('mui/fireworks',function(S){
 	var $ = S.Node.all;

 	function random(min,max,notInt){
		var ret = min+Math.random()*(max-min);
		return notInt ? ret : Math.ceil(ret);
	}
	function getxy(val){
			var step = val / 7;
			return random(step*2,step*6);
	}
	function getBombXY(self){

		if (self.isWindow){

			return {
				x: getxy(self.clientWidth),
				y: getxy(self.clientHeight)
			}
		}

		var cwidth = self.rectWidth ,
			cheight = self.rectHeight,
			offset = self.rectOffset
			width = self.bombWidth;
		return {
			x : random(offset.left,offset.left+cwidth,true),
			y: self.clientHeight-random(offset.top,offset.top+cheight,true)
		}
	};

 	/**
     * 简单的烟花播放脚本
     * @class Fireworks
     * @pram {KISSY selector} arena 播放舞台
     * @pram {Array/String} data 烟花数据
     * @constructor
     */
 	function Fireworks (stage,data,config){

 		if (window.CanvasRenderingContext2D){

 			this.initalize(stage,data,config,this);
 		} else {
             return alert("需要支持canvas");
             /*
	 		window.FlashCanvasOptions = {
		 		swfPath: 'http://www.chongqi.com/fireworks/src/'
	 		};
	 		var self = this,
	 		    canvas = document.createElement('canvas');
	 			document.body.appendChild(canvas);

	 		if (window.G_vmlCanvasManager){

			    self.isFlash = true;
				self.canvas = window.G_vmlCanvasManager.initElement(
				 	 		self.initCanvas(self,stage,config,canvas));
			    self.initalize(stage,data,config,self);
	 		} else {

                 /*
		 		S.getScript(window.FlashCanvasOptions.swfPath+'flashcanvas.js',function(){
			 		setTimeout(function(){
			 		  self.isFlash = true;
				 	  self.canvas = window.G_vmlCanvasManager.initElement(
				 	 		self.initCanvas(self,stage,config,canvas));
			 		  self.initalize(stage,data,config,self);
			 		},10);
		 		})
	 		}*/
 		}
 	}

 	return S.augment(Fireworks,{
 		initalize: function(stage,data,config,that){

 			//获得舞台canvas对象
 			if (!that.canvas){
 				that.canvas = this.initCanvas(that,stage,config);
 			}
 			that.context = that.canvas.getContext('2d');

 			//获取烟花信息
 			that.data = (function(){
 				if (typeof data=='string'){
					var retval = [];
						data = data.split(',');
					for(var i=0,len=data.length;i<len;i+=2){
						retval.push([data[i],data[i+1]]);
					}
					return retval;
				}
				return data;
 			})();

 			if ( that.isWindow  && (stage = $(document.body))){

 				that.bindEvent();
 				that.rectOffset = that.config.bombRectOffset || stage.offset();
 				return stage.append(that.canvas);
 			}
 			that.rectOffset = that.config.bombRectOffset || that.stage.offset();
 			that.stage.append(that.canvas);
 		},
 		//初始化画布
 		initCanvas: function(that,stage,config,_canvas){

 			//舞台
 			that.stage = $(stage);


 			//配置信息
 			that.config = S.mix({
 				zIndex: 1e6,//舞台层级 默认为1e6
 				bombSustainedTime: 100,//爆炸持续时间，如果
 				bombColor: 'rgba(249,135,95,1)',
 				bombShadow: 'rgba(255,255,255,1)',
 				//爆炸区域范围
 				//bombRectWidth: 600,
 				//bombRectHeight: 500,
 				//bombRectOffset: {left:100,top:100},

 				//炸点的最大宽度
 				bombWidth: 300,
 				//炸点是否扩散，扩散性能比较差,且轮廓不够清晰
 				bombDiffusion: false,
 				//炸点爆炸
 				bombDecline:9
 			},config);


 			that.clientWidth  = that.stage.width();
 			that.clientHeight = that.stage.height();
 			that.rectWidth = that.config.bombRectWidth || that.clientWidth;
 			that.rectHeight = that.config.bombRectHeight || that.clientHeight;
 			that.bombWidth = that.config.bombWidth || 350;


	 		var canvas = _canvas || document.createElement('canvas'),
 				offset = that.clientOffset;

			$(canvas).css({
				position:that.isWindow = S.isWindow(stage)?'fixed':'absolute',
				width: that.clientWidth,
				height:that.clientHeight,
				top: 0,
				left:0,
				display:'none',
				zIndex: that.config.zIndex
			});
			canvas.width = that.clientWidth;
			canvas.height = that.clientHeight;

			return canvas;
 		},
 		requestAnimationFrame: function(){
			return window.requestAnimationFrame
				|| window.mozRequestAnimationFrame
				|| window.webkitRequestAnimationFrame
				|| window.msRequestAnimationFrame
				|| window.oRequestAnimationFrame
				|| function(callback) {
				setTimeout(callback, 1000 / 60);
			}
		}(),
 		bindEvent: function(){
 			var self = this;

 			$(window).on('resize',function(){
 				self.clientWidth = self.stage.width();
 				self.clientHeight = self.stage.height();
 				self.resetStage();//重置舞台
 			});
 		},
 		resetStage: function(){
 			var self = this;
 			var width = self.stage.width(),
 				height =self.stage.height();

 			$(self.canvas).css({width:width,height:height})
 			self.canvas.width = self.clientWidth =width;
 			self.canvas.height = self.clientHeight= height;
 			self.fire('reset',{width:self.clientWidth,height:self.clientHeight});
 		},
 		//对数据做一定的修正
 		repair: function(that){
 			var centerY,centerX,
 				data = that.data,
				fire = null,idx=0,
				minX = 1e4,maxX =0,
				maxY = 0,minY = 1e4;

			//获得播放矩阵的边界值
			while ( fire = data[idx++] ) {
				maxX = Math.max(fire[0],maxX);minX = Math.min(fire[0],minX);
				maxY = Math.max(fire[1],maxY);minY = Math.min(fire[1],minY);
			}
			//设置中心点
			centerX = (maxX-minX)/2 + minX;
			centerY = (maxY-minY)/2 + minY;

			//爆炸点集合
			that.BurstPoint = [];
			//爆炸持续事件
			that.bombSustainedTime = that.config.bombSustainedTime;
			that.bombFrame = idx =0;//开始爆炸总共多少帧
			that.decelerate = 0.998;//加速度
			that.maxframe = that.bombWidth/2;//-maxX+minX) / stepX;



			while (fire = data[idx++] ) {
				var lx = fire[0]-centerX,
					ly = fire[1]-centerY,
					clen = Math.sqrt(lx*lx+ly*ly),
					speed = clen/(that.bombSustainedTime),
					stepX = Math.abs(lx * (speed/clen)),
					stepY = Math.abs(ly * (speed/clen));

				if (that.isFlash && idx % 2) continue;

				that.BurstPoint.push({
					//速度
					deform: lx<centerX?1:-1,
					delay: random(0.75,1,true)* that.bombSustainedTime,
					stepX: lx<0?-stepX:stepX,
					stepY: ly>0?-stepY:stepY,
					//加速消亡
					death: random(0.2,1.2,true),
					//点的半径
					radiusMax: random(1.0,2.0,true),
					radiusSpeed:0.05,
					radius: 0,
					//显示时候的值 依据radius判断
					show: random(0.01,2.05,true),
					//初始位置
					x: this.bombxy.x,
					y: this.bombxy.y,

					color:that._getColor(that.config.bombColor),
					shadow:that._getColor(that.config.bombShadow)
				});
			}
 		},
 		//设置爆炸最大宽度
 		setBombWidth: function(width){
 			this.bombWidth = width;
 		},
 		//设置播放最大时间
 		setSustainedTime: function(time){
 			this.config.bombSustainedTime = time;
 		},
 		//动画针
 		frame: function(that){

 			that.requestAnimationFrame.call(window,function(){
 				//console.log(that.ihalt);
				if (!that.ihalt){
					if (undefined ==that.step(that)){
						//setTimeout(function(){

						that.frame(that);
						//},0)
					} else {
						that.played();
					}
				}
			});
 		},
 		played: function(){
 			this.canvas.style.display='none';
 			this.fire('played');
 		},
 		play: function(x,y){

	 		//判断是否能初始化
	 		if (typeof this.rectOffset == 'undefined'){
	 			var self = this;
	 			document.title='replay'+(+new Date);
		 		return setTimeout(function(){
		 			 document.title+=+new Date;
			 		 self.play(x,y);
		 		},1000);
	 		}

 			this.canstop = false;
 			this.stepframe =0;
			this.bombxy = arguments.length && x && y
 				?  {x:x,y:this.clientHeight-y} : getBombXY(this);

 			this.fire('play');
 			this.canvas.style.display="block";

 			this.repair(this);

 			if (this.BurstPoint.length){
 				this.frame(this,this.ihalt = false);
 				} else {
 				this.played();
 			}
 		},
 		step: function(that,bombxy){
 			var idx=-1,fire,Y,X,
				nxy = bombxy || this.bombxy,
				height= that.clientHeight,
				total = that.BurstPoint.length;

			if ( total ) {

				that._clearRect(that.bombFrame++);

				while ( fire = that.BurstPoint[++idx] ) {

					if (  /*(xc = that.bombFrame-fire.delay) <0 || */ fire.delay< 0 ) {

						if ( that .BurstPoint.splice(idx,1) && !--total){
							//played
							return that.ihalt = true;
						}
						continue;
					}

					if (that.bombFrame > 20){
						fire.stepY *= that.decelerate;
						fire.stepX *= that.decelerate;
						fire.delay--;
					}

					if (fire.x -nxy.x <that.maxframe  &&  !that.canstop ){
						fire.y +=fire.stepY;
						fire.x +=fire.stepX;
					}else {
						fire.delay-=fire.death;//加速消亡
						that.canstop = true;
					}


					Y = height-fire.y + that.decelerate*fire.stepY ;
					if ( that.config.bombDecline ){
						Y+= that.bombFrame / that.config.bombDecline;
					}

					if ((fire.radius += fire.radiusSpeed)>fire.show){
						that._draw(fire.x,Y,fire.radius,fire);
					}
				}
				//}
			}
 		},
 		_getColor: function(color){
 			if (typeof color =='string'){
 				return color;
 			}
 			return 'rgba('+[color.r,color.g,color.b,color.a].join(',')+')';
 		},
 		_draw: function(x,y,radius,fire){
			var self = this,radius,
				idx=0,item;
				//var c = self._getColor();
			if(Math.random()<0.7){
				return ;
			}
			//轮廓比较清晰的烟花
			if ( !self.config.bombDiffusion ){

				self.fire('draw',{x:x,y:y,radius:radius=Math.min(radius,2)});

				return self._drawCross(x,y,radius ,fire.color,fire.shadow);
			}


			var star = self._star(radius);

			while(item = star[idx++]){
				var xx = item[0]+x,
					yy = item[1]+y,
					r = item[2];

				self._drawCross(xx,yy,r/2,fire.color,fire.shadow);
			}
		},
		//获取圆内的随机点坐标
		//获取的坐标为相对于中心点的位移坐标
		_star: function(r){
			/*var ran = [],
				max ,is;
			switch (true){
				case this.frame>this.bombFrame*0.90:
					max =2;break;
				default:
					//max =1;break;
				// Math.PI * R*R < n * Math.PI *r*r(命r=2)=> 求随机点的个数
				// r*r*4 > Math.PI*r*r
					is = true;
					max =Math.min(4,Math.max(1,Math.floor((4/ Math.PI) * Math.sqrt(r*r/4))));
			}*/
			return [[random(-r-1,r,true),random(-r-1,r,true),random(0.2,0.4,true)]];

		},
		_clearRect: function(){

			this.canvas.width = this.clientWidth;
			this.fire('clearRect');
		},
		_drawCross: function(){

			function drawCross(cxt,x,y,sc,color,linewidth){
				cxt.beginPath();
				cxt.strokeStyle = color;
				cxt.lineWidth = linewidth;
				cxt.moveTo(x-sc,y-sc);
				cxt.lineTo(x+sc,y+sc);
				cxt.stroke();
				cxt.moveTo(x+sc,y-sc);
				cxt.lineTo(x-sc,y+sc);
				cxt.stroke();
				cxt.closePath();
			}

			return function (x,y,r,shadowColor,fillStyle){

				var sc  = Math.ceil(r/2),
					cxt = this.context;
				drawCross(cxt,x,y,sc,shadowColor,1.4);
				this.isFlash || drawCross(cxt,x,y,sc-0.9,fillStyle,0.7);

			}
		}()
 	},S.Event.Target)
 });
