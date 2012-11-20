(function(G){
  /*
   简单语法高亮器
   作者：蜗眼　<iceet@uoeye.com>
  */
  var Highlight = function(){},
  	
  	rnewline = /\n/g,
  	rtabline = /\t/g,
  	regsafe  = /([.*?\/\\])/g,
  	rregexp  = /([^\w\\]|^)(\/.+\/)([igm]*)?([^\w]|$)/,
  	rstring  = /([^\w\\]|^)(['"].*?['"])([^\w]|$)/g;
  	
  	Highlight.prototype = {
  		//注册语法
  		addSyntax: function(type,syntax){
  			this['@syntax'] || (this['@syntax']={});
  			this['@syntax'][type] = syntax;
  		},
  		//高亮所有
  		HighlightAll: function(){
  			var pres = document.getElementsByTagName('pre'),
  				type ,item ,idx=0;
  			while(item = pres[idx++]){
  				this.Hightight(item,item.getAttribute('class') 
  					|| item.getAttribute('className')||'jscript');
  			}
  		},
  		//初始化高亮
  		Hightight: function(pre,type,pop){
  			if (this.nSyntax = this['@syntax'][type]){
  				
  				this.cutter = (pre.innerHTML+'').
  						replace(rtabline,'    ').split( rnewline );//标记切割后的行
  				this.replace = [];//标记替换对象
  				this.multideep	= 0;//标记当前多行注释深度
  				
  				(pop=this.cutter.pop()) && (this.cutter.push(pop));
  				
  				//多行注释
  				this.multi = this.nSyntax['multicomments'];
  				this.multi = this.multi && this.multi.split(/\s+/);
  				
  				var idx =0,item;
  				while((item = this.cutter[idx])!==undefined){
  					this.cutter[idx++] = this.highLine(item);
  				}
  				
  				this.rander(pre);
  			}
  		},
  		//缓存这个 正则变量
  		regexp: function(){
  			var cache = {};
  			return function(key,regexp){
  				return cache[key] || (cache[key]= new RegExp(regexp,'g'))
  			}
  		}(),
  		//正则安全过滤
  		regsafe: function(){
  			var cache = {};
  			return function(text){
  				return cache[text] || (cache[text]=text.replace(regsafe,"\\$1"))
  			}
  		}(),
  		//格式化字符串
  		format: function(str,type){
  			return '<span class="'+type+'">'+str+'</span>';
  		},
  		//渲染数据
  		rander: function(pre){
  			var html= '<ol><li><div>'+this.cutter.join('</div></li><li><div>')+'</div></li></ol>',
  				idx = this.replace.length-1 ,item;
  				html = this.builword('keyword',this.builword('builtin',html));
  				
  			while(item = this.replace[idx]){ 
  				html = html.replace('{[{['+(idx--)+']}]}',this.format(item[1],item[0]));
  			}
  			pre.innerHTML = html;
  		},
  		//高亮行
  		highLine: function( line ,h){
  			
  			//1、处理字符串
  		    line = line.replace(rstring,function(_,$1,$2,$3){
  				Highlighter.replace.push(['string',$2]);
  				return $1+'{[{['+(Highlighter.replace.length-1)+']}]}'+$3;
  			});
  			
  			/* 
  			 * 单行注释在多行注释内失效
  			 * 2、处理多行注释
  			 */
  			//看看有没有多行注释 /*
  			if (this.multi && line.indexOf(this.multi[0])>-1) {
  				//如果这里只是多行注释的开始的时候，而不是嵌套注释
  				var ml = line.match(this.regexp('mutiL',this.regsafe(this.multi[0]))),
  					mr = line.match(this.regexp('mutiR',this.regsafe(this.multi[1])))||[];
  				
  				if((this.multideep += ml.length-mr.length) <=1){
  					line = this.highrep(line,'comments','multiRight',
  						this.regsafe(this.multi[0])+'.*?(?:'+this.regsafe(this.multi[1])+'|$)');
  				} 
  			}
  			
  			if ( this.multideep ) {//如果在多汗注释里面，就直接返回注释
  				//判断是否具有多行注释结束符号 */
  				if (line.indexOf(this.multi[1])==-1){
  					return this.format(line,'comments');
  				}
  				this.multideep--;
  				//还在多行注释里面，将前面的注释过滤掉。
  				line = this.highrep(line,'comments','multiLeft','^.*'+this.regsafe(this.multi[1]));
  			}
  			//3、处理单行注释
  			if ( this.nSyntax.singlecomments && 
  				line.indexOf(this.nSyntax.singlecomments)>-1){
  				
  				line = this.highrep(line,'comments','singlec',
  					this.regsafe(this.nSyntax.singlecomments)+'.*');
  			}
  			
  			//4、处理正则
  			return line.replace(rregexp,function(_,$1,$2,$3,$4){
  				$3 && ($2+=$3);
  				Highlighter.replace.push(['regexp',$2]);
  				return $1+'{[{['+(Highlighter.replace.length-1)+']}]}'+$4;
  			}).replace(/\s/g,'&nbsp;');
  		},
  		builword: function(type,line){
  			var builword = this.nSyntax[type],
  				idx =0 ,item;
  			if ( builword ) {
  				while (item = builword[idx++]) {
  					line = line.replace(this.regexp(item,'\\b'+this.regsafe(item)+'\\b'),
  						function(){
  						return Highlighter.format(item,type);
  					});
  				}
  			}
  			return line;
  		},
  		highrep: function(line,type,regtype,regexp){
  			return line.replace(this.regexp(regtype,regexp),
  				function($1){
  					Highlighter.replace.push([type,$1]);
  					return '{[{['+(Highlighter.replace.length-1)+']}]}';
  			});
  		}
  	};
  	G.Highlighter = new Highlight;
  
  	//加入js语法
  	Highlighter.addSyntax('jscript',{
  		//多行注释
  		multicomments: '/* */',
  		//单行注释
  		singlecomments: '//',
  		//关键字
  		keyword: 'new,var,function,arguments,returen,delete,continue,break,this,prototype,typeof,case,do,if,else,switch,catch,try,null,default,for,finally,debugger,true,false,while,void'.split(','),
  		//内建对象函数,当标记为true的时候，表示该内建对象为window上的所有元素
  		builtin: function(keys){
  			for(var p in window){
  				  keys.push(p);
  			}
  			return keys;
  		}([])
  	});
})(this)
