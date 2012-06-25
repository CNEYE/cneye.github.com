(function(window,undefined){
	
		/*
	 * 这里抛弃使用对象来生成的情况，是为了提高编译效率，
	 * 减少反复new带来的效率问题
	 */
	var JSmart = function(template,id){
		//这里直接返回那个编译之后的函数
		//减少new语句 提高效率
		return JSmart_compiled(template,id || uuid++);
	},

	//判断是否是新的JS字符串引擎
	isNewEngine 	= ''.trim ? (''.trim.toString().indexOf('return') >-1 ? false : true ) : false,
	//唯一标识
	uuid 			= 1e2,

	//一下为相关正则
	regrsegment 	= /(.*?){\/\s*(.*?)\s*\/\}/gm,
	regrlrtrim  	= /(^\s*|\s*$)/g,
	regrnewline     = /\n/g,
	regrendforeach	= /^(\/foreach|\})/g,//endforeach and the '}'
	regrelseif      = /^else\s*(?:(if)\s*\(?([^\)]*))?/i,
	regrif			= /if\s*\(?([^\)]*)/i,
	regrforeach 	= /foreach\s*\(?\s*([^\s]*)\s*as\s*\$?([^\s\)]*)/i,
	regrfor			= /for\s*\(?([^\)]*)\)?\s*\{?/,
	regrinclude		= /include\s+(?:plugin|smart)\s*=['"]?([^\s'"]+)\s+data\s*=['"]?([^\s'"]*)/i,
	regrplugin		= /\{plugin\}/g,

	//打印字符串
	Print  			= isNewEngine ? ['var __output__ ="";','__output__+=',';','__output__']
						 : ['var __output__ =[];','__output__.push(',');','__output__.join("")'],
	Include         = '$plugin(\'{plugin}\') && ('+Print[1]+'$plugin(\'{plugin}\')({data})'+Print[2].replace(';','')+');';
	//缓存信息
	Cache 			= {};

	/**
	 * 模板编译
	 * @template {String} 传入模板
	 * @id {String} 唯一ID
	 */
	function JSmart_compiled(template,id){

		var compiled = [] , end  , level = ['__data__'] , prevel = [] , helper;

		//如果已经编译了的直接加入编译结果
		if(helper = JSmart.plugin(id)){
			return helper;
		}

		end = template.replace(regrnewline,'')
					  .replace(regrsegment,function(_,metachar,statement,match){

			var ret = '' , prefix = level[level.length-1];

			//如果原字符不为空的时候加入
			if(metachar !== ''){
				compiled.push( Print[1] + '"' + metachar + '"' + Print[2] );
			}

			switch(statement.charAt(0).toUpperCase()){
				//赋值语句
				case '$' : case '=':
					ret = Print[1] + JSmart_equal(prefix,statement) + Print[2];
					break;
				//deal with the endif enfforeach statement
				case '/' : case '}':
					if(regrendforeach.test(statement)){
						level.pop() && prevel.pop();
					}
					ret = '}';
					break;
				//deal width elseif /else statement
				case 'E':
					if((match = statement.match(regrelseif)) && (ret = '}else ')){
						//deal width elseif
						if( match[1] ){
							ret += 'if('+JSmart_equal(prefix,statement)+')';
						}
						ret += '{';
					}else if( match = statement.match()){
						ret = Incluce.replace( regrplugin,match[1] )
									 .replace('{data}',JSmart_equal(prefix,match[2]) );
					}
					break;
				//deal width if / include statement
				case 'I':
					if( match = statement.match(regrif)){
						ret = 'if('+JSmart_equal(prefix,statement)+')';
					}else if( match = statement.match(regrinclude)){
						ret = Include.replace( regrplugin,match[1] )
									 .replace('{data}',JSmart_equal(prefix,match[2]) );
					}
					break;
				//deal width the foreach / for 语句
				//deal width the foreach / for 语句
				case 'F':
					//foreach
					if( (match = statement.match(regrforeach)) && ( prefix = match[2]) ){

						helper = [prefix+(++uuid)+'__D',prefix+uuid+'__I',prefix+uuid+'__L'];

						ret = ['for(var ',helper[0],'=',JSmart_equal(prevel.join('.') || '__data__',match[1]),
										',',helper[1],'=0,',helper[2],'=',helper[0],'.length;',helper[1],'<',helper[2],
									 	';',helper[1],'++){var ',prefix,'=',helper[0],'[',helper[1],'];'
							  ].join('');
							  

					}else if( match = statement.match(regrfor)){
						
						ret = 'for('+JSmart_equal(prefix,match[1])+'){';
					}

					prevel.push(prefix) && level.push('');
					break;
				default:
					throw new Error('Does not support the template format:['+statement+']');
					break;

			}

			ret && compiled.push(ret);
			return '';
		});

		end && compiled.push( Print[1] + '"' + end + '"' + Print[2] );

		try {
			ret =  new Function('__data__','$plugin',Print[0]+'$plugin=$plugin||JSmart.plugin;try{' + compiled.join('') + '}catch(e){JSmart.stack.push({e:e,message:e.message()});window.console && console.log(e,e.message())};return '+Print[3]);
			return JSmart.plugin(id,function(data){
				return ret(data,JSmart.plugin);
			});
		
		}catch(e){
			window.console && console.log(e);
		}
	}
	/*
	 * 修正赋值变量的前缀
	 */
	function JSmart_equal(prefix,val){

		return val.replace('=','')
				  .replace('$',prefix ? prefix + '.' : '');
	}
	/*
	 * 插件注册
	 * @name {String} 插件名称
	 * @template {String} 模板字符串
	 * 这里的插件主要是实现 include 语句的功能
	 */
	JSmart.plugin = function(name,template){

		if(template && !Cache['#plugin:'+name]){
			return Cache['#plugin:'+name] = typeof template == 'string'
								? JSmart_compiled(template,name) : template;
		}else{
			return Cache['#plugin:'+name] || null;
		}
	};
	JSmart.stack = [];
	
	window.JSmart = JSmart;
})(window);;;

(function(){
	var ajax = function(options){
		if(!(this instanceof arguments.callee)){
			return new arguments.callee(options);
		}
		this.entry(options);
		this.init();
	};
	ajax.prototype = {
		entry : function(options){
			this.url  = options.url;
			this.type = options.type;
			this.success = options.success;
			this.data = this.getData(options.data || {});
			if(this.type === 'get' && this.data){
				this.url  += (this.url.indexOf('?')>-1 ? '&':'?')+this.data;
				this.data = null;
			}
		},
		init : function(){
			
			var self = this;
			this.xhr = this.getXHR();
			
			this.xhr.open(this.type.toUpperCase(),this.url,true);
			this.xhr.onreadystatechange = function(){
			
				if(self.xhr.readyState == 4 && self.xhr.status==200){
					var data = '';
					console.log(self.xhr.responseText);
					try{
						data = (new Function('return '+self.xhr.responseText))();
					}catch(e){window.console && console.log(e,e.message);}
					self.success && self.success(data);
					self.xhr.onreadystatechange = null;
				}
			};
			this.xhr.send(this.data);
		},
		getData: function(data){
			var ret =[];
			for(var p in data){
				if(data.hasOwnProperty(p)){
					ret.push(p+'='+data[p])
				}
			}
			return ret.join('&');
		},
		getXHR : function(){
			try{
				return new XMLHttpRequest();
			}catch(e){
				return new ActiveXObject("Microsoft.XMLHTTP");
			}
		}
	};
	window.ajax = ajax;
})();;;
