/*!
 * iScroll v4.1.9 ~ Copyright (c) 2011 Matteo Spinelli, http://cubiq.org
 * Released under MIT license, http://cubiq.org/license
 */

(function(){
var m = Math,
	vendor = (/webkit/i).test(navigator.appVersion) ? 'webkit' :
		(/firefox/i).test(navigator.userAgent) ? 'Moz' :
		'opera' in window ? 'O' : '',

	// Browser capabilities
	has3d = 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix(),
	hasTouch = 'ontouchstart' in window,
	hasTransform = vendor + 'Transform' in document.documentElement.style,
	isAndroid = (/android/gi).test(navigator.appVersion),
	isIDevice = (/iphone|ipad/gi).test(navigator.appVersion),
	isPlaybook = (/playbook/gi).test(navigator.appVersion),
	hasTransitionEnd = isIDevice || isPlaybook,
	nextFrame = (function() {
	    return window.requestAnimationFrame
			|| window.webkitRequestAnimationFrame
			|| window.mozRequestAnimationFrame
			|| window.oRequestAnimationFrame
			|| window.msRequestAnimationFrame
			|| function(callback) { return setTimeout(callback, 1); }
	})(),
	cancelFrame = (function () {
	    return window.cancelRequestAnimationFrame
			|| window.webkitCancelRequestAnimationFrame
			|| window.mozCancelRequestAnimationFrame
			|| window.oCancelRequestAnimationFrame
			|| window.msCancelRequestAnimationFrame
			|| clearTimeout
	})(),

	// Events
	RESIZE_EV = 'onorientationchange' in window ? 'orientationchange' : 'resize',
	START_EV = hasTouch ? 'touchstart' : 'mousedown',
	MOVE_EV = hasTouch ? 'touchmove' : 'mousemove',
	END_EV = hasTouch ? 'touchend' : 'mouseup',
	CANCEL_EV = hasTouch ? 'touchcancel' : 'mouseup',
	WHEEL_EV = vendor == 'Moz' ? 'DOMMouseScroll' : 'mousewheel',

	// Helpers
	trnOpen = 'translate' + (has3d ? '3d(' : '('),
	trnClose = has3d ? ',0)' : ')',

	// Constructor
	iScroll = function (el, options) {
		var that = this,
			doc = document,
			i;

		that.wrapper = typeof el == 'object' ? el : doc.getElementById(el);
		that.wrapper.style.overflow = 'hidden';
		that.scroller = that.wrapper.children[0];

		// Default options
		that.options = {
			hScroll: true,
			vScroll: true,
			x: 0,
			y: 0,
			bounce: true,
			bounceLock: false,
			momentum: true,
			lockDirection: true,
			useTransform: true,
			useTransition: false,
			topOffset: 0,
			checkDOMChanges: false,		// Experimental

			// Scrollbar
			hScrollbar: true,
			vScrollbar: true,
			fixedScrollbar: isAndroid,
			hideScrollbar: isIDevice,
			fadeScrollbar: isIDevice && has3d,
			scrollbarClass: '',

			// Zoom
			zoom: false,
			zoomMin: 1,
			zoomMax: 4,
			doubleTapZoom: 2,
			wheelAction: 'scroll',

			// Snap
			snap: false,
			snapThreshold: 1,

			// Events
			onRefresh: null,
			onBeforeScrollStart: function (e) { e.preventDefault(); },
			onScrollStart: null,
			onBeforeScrollMove: null,
			onScrollMove: null,
			onBeforeScrollEnd: null,
			onScrollEnd: null,
			onTouchEnd: null,
			onDestroy: null,
			onZoomStart: null,
			onZoom: null,
			onZoomEnd: null
		};

		// User defined options
		for (i in options) that.options[i] = options[i];
		
		// Set starting position
		that.x = that.options.x;
		that.y = that.options.y;

		// Normalize options
		that.options.useTransform = hasTransform ? that.options.useTransform : false;
		that.options.hScrollbar = that.options.hScroll && that.options.hScrollbar;
		that.options.vScrollbar = that.options.vScroll && that.options.vScrollbar;
		that.options.zoom = that.options.useTransform && that.options.zoom;
		that.options.useTransition = hasTransitionEnd && that.options.useTransition;
		
		// Set some default styles
		that.scroller.style[vendor + 'TransitionProperty'] = that.options.useTransform ? '-' + vendor.toLowerCase() + '-transform' : 'top left';
		that.scroller.style[vendor + 'TransitionDuration'] = '0';
		that.scroller.style[vendor + 'TransformOrigin'] = '0 0';
		if (that.options.useTransition) that.scroller.style[vendor + 'TransitionTimingFunction'] = 'cubic-bezier(0.33,0.66,0.66,1)';
		
		if (that.options.useTransform) that.scroller.style[vendor + 'Transform'] = trnOpen + that.x + 'px,' + that.y + 'px' + trnClose;
		else that.scroller.style.cssText += ';position:absolute;top:' + that.y + 'px;left:' + that.x + 'px';

		if (that.options.useTransition) that.options.fixedScrollbar = true;

		that.refresh();

		that._bind(RESIZE_EV, window);
		that._bind(START_EV);
		if (!hasTouch) {
			that._bind('mouseout', that.wrapper);
			that._bind(WHEEL_EV);
		}

		if (that.options.checkDOMChanges) that.checkDOMTime = setInterval(function () {
			that._checkDOMChanges();
		}, 500);
	};

// Prototype
iScroll.prototype = {
	enabled: true,
	x: 0,
	y: 0,
	steps: [],
	scale: 1,
	currPageX: 0, currPageY: 0,
	pagesX: [], pagesY: [],
	aniTime: null,
	wheelZoomCount: 0,
	
	handleEvent: function (e) {
		var that = this;
		switch(e.type) {
			case START_EV:
				if (!hasTouch && e.button !== 0) return;
				that._start(e);
				break;
			case MOVE_EV: that._move(e); break;
			case END_EV:
			case CANCEL_EV: that._end(e); break;
			case RESIZE_EV: that._resize(); break;
			case WHEEL_EV: that._wheel(e); break;
			case 'mouseout': that._mouseout(e); break;
			case 'webkitTransitionEnd': that._transitionEnd(e); break;
		}
	},
	
	_checkDOMChanges: function () {
		if (this.moved || this.zoomed || this.animating ||
			(this.scrollerW == this.scroller.offsetWidth * this.scale && this.scrollerH == this.scroller.offsetHeight * this.scale)) return;

		this.refresh();
	},
	
	_scrollbar: function (dir) {
		var that = this,
			doc = document,
			bar;

		if (!that[dir + 'Scrollbar']) {
			if (that[dir + 'ScrollbarWrapper']) {
				if (hasTransform) that[dir + 'ScrollbarIndicator'].style[vendor + 'Transform'] = '';
				that[dir + 'ScrollbarWrapper'].parentNode.removeChild(that[dir + 'ScrollbarWrapper']);
				that[dir + 'ScrollbarWrapper'] = null;
				that[dir + 'ScrollbarIndicator'] = null;
			}

			return;
		}

		if (!that[dir + 'ScrollbarWrapper']) {
			// Create the scrollbar wrapper
			bar = doc.createElement('div');

			if (that.options.scrollbarClass) bar.className = that.options.scrollbarClass + dir.toUpperCase();
			else bar.style.cssText = 'position:absolute;z-index:100;' + (dir == 'h' ? 'height:7px;bottom:1px;left:2px;right:' + (that.vScrollbar ? '7' : '2') + 'px' : 'width:7px;bottom:' + (that.hScrollbar ? '7' : '2') + 'px;top:2px;right:1px');

			bar.style.cssText += ';pointer-events:none;-' + vendor + '-transition-property:opacity;-' + vendor + '-transition-duration:' + (that.options.fadeScrollbar ? '350ms' : '0') + ';overflow:hidden;opacity:' + (that.options.hideScrollbar ? '0' : '1');

			that.wrapper.appendChild(bar);
			that[dir + 'ScrollbarWrapper'] = bar;

			// Create the scrollbar indicator
			bar = doc.createElement('div');
			if (!that.options.scrollbarClass) {
				bar.style.cssText = 'position:absolute;z-index:100;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);-' + vendor + '-background-clip:padding-box;-' + vendor + '-box-sizing:border-box;' + (dir == 'h' ? 'height:100%' : 'width:100%') + ';-' + vendor + '-border-radius:3px;border-radius:3px';
			}
			bar.style.cssText += ';pointer-events:none;-' + vendor + '-transition-property:-' + vendor + '-transform;-' + vendor + '-transition-timing-function:cubic-bezier(0.33,0.66,0.66,1);-' + vendor + '-transition-duration:0;-' + vendor + '-transform:' + trnOpen + '0,0' + trnClose;
			if (that.options.useTransition) bar.style.cssText += ';-' + vendor + '-transition-timing-function:cubic-bezier(0.33,0.66,0.66,1)';

			that[dir + 'ScrollbarWrapper'].appendChild(bar);
			that[dir + 'ScrollbarIndicator'] = bar;
		}

		if (dir == 'h') {
			that.hScrollbarSize = that.hScrollbarWrapper.clientWidth;
			that.hScrollbarIndicatorSize = m.max(m.round(that.hScrollbarSize * that.hScrollbarSize / that.scrollerW), 8);
			that.hScrollbarIndicator.style.width = that.hScrollbarIndicatorSize + 'px';
			that.hScrollbarMaxScroll = that.hScrollbarSize - that.hScrollbarIndicatorSize;
			that.hScrollbarProp = that.hScrollbarMaxScroll / that.maxScrollX;
		} else {
			that.vScrollbarSize = that.vScrollbarWrapper.clientHeight;
			that.vScrollbarIndicatorSize = m.max(m.round(that.vScrollbarSize * that.vScrollbarSize / that.scrollerH), 8);
			that.vScrollbarIndicator.style.height = that.vScrollbarIndicatorSize + 'px';
			that.vScrollbarMaxScroll = that.vScrollbarSize - that.vScrollbarIndicatorSize;
			that.vScrollbarProp = that.vScrollbarMaxScroll / that.maxScrollY;
		}

		// Reset position
		that._scrollbarPos(dir, true);
	},
	
	_resize: function () {
		var that = this;
		setTimeout(function () { that.refresh(); }, isAndroid ? 200 : 0);
	},
	
	_pos: function (x, y) {
		x = this.hScroll ? x : 0;
		y = this.vScroll ? y : 0;

		if (this.options.useTransform) {
			this.scroller.style[vendor + 'Transform'] = trnOpen + x + 'px,' + y + 'px' + trnClose + ' scale(' + this.scale + ')';
		} else {
			x = m.round(x);
			y = m.round(y);
			this.scroller.style.left = x + 'px';
			this.scroller.style.top = y + 'px';
		}

		this.x = x;
		this.y = y;

		this._scrollbarPos('h');
		this._scrollbarPos('v');
	},

	_scrollbarPos: function (dir, hidden) {
		var that = this,
			pos = dir == 'h' ? that.x : that.y,
			size;

		if (!that[dir + 'Scrollbar']) return;

		pos = that[dir + 'ScrollbarProp'] * pos;

		if (pos < 0) {
			if (!that.options.fixedScrollbar) {
				size = that[dir + 'ScrollbarIndicatorSize'] + m.round(pos * 3);
				if (size < 8) size = 8;
				that[dir + 'ScrollbarIndicator'].style[dir == 'h' ? 'width' : 'height'] = size + 'px';
			}
			pos = 0;
		} else if (pos > that[dir + 'ScrollbarMaxScroll']) {
			if (!that.options.fixedScrollbar) {
				size = that[dir + 'ScrollbarIndicatorSize'] - m.round((pos - that[dir + 'ScrollbarMaxScroll']) * 3);
				if (size < 8) size = 8;
				that[dir + 'ScrollbarIndicator'].style[dir == 'h' ? 'width' : 'height'] = size + 'px';
				pos = that[dir + 'ScrollbarMaxScroll'] + (that[dir + 'ScrollbarIndicatorSize'] - size);
			} else {
				pos = that[dir + 'ScrollbarMaxScroll'];
			}
		}

		that[dir + 'ScrollbarWrapper'].style[vendor + 'TransitionDelay'] = '0';
		that[dir + 'ScrollbarWrapper'].style.opacity = hidden && that.options.hideScrollbar ? '0' : '1';
		that[dir + 'ScrollbarIndicator'].style[vendor + 'Transform'] = trnOpen + (dir == 'h' ? pos + 'px,0' : '0,' + pos + 'px') + trnClose;
	},
	
	_start: function (e) {
		var that = this,
			point = hasTouch ? e.touches[0] : e,
			matrix, x, y,
			c1, c2;

		if (!that.enabled) return;

		if (that.options.onBeforeScrollStart) that.options.onBeforeScrollStart.call(that, e);

		if (that.options.useTransition || that.options.zoom) that._transitionTime(0);

		that.moved = false;
		that.animating = false;
		that.zoomed = false;
		that.distX = 0;
		that.distY = 0;
		that.absDistX = 0;
		that.absDistY = 0;
		that.dirX = 0;
		that.dirY = 0;

		// Gesture start
		if (that.options.zoom && hasTouch && e.touches.length > 1) {
			c1 = m.abs(e.touches[0].pageX-e.touches[1].pageX);
			c2 = m.abs(e.touches[0].pageY-e.touches[1].pageY);
			that.touchesDistStart = m.sqrt(c1 * c1 + c2 * c2);

			that.originX = m.abs(e.touches[0].pageX + e.touches[1].pageX - that.wrapperOffsetLeft * 2) / 2 - that.x;
			that.originY = m.abs(e.touches[0].pageY + e.touches[1].pageY - that.wrapperOffsetTop * 2) / 2 - that.y;

			if (that.options.onZoomStart) that.options.onZoomStart.call(that, e);
		}

		if (that.options.momentum) {
			if (that.options.useTransform) {
				// Very lame general purpose alternative to CSSMatrix
				matrix = getComputedStyle(that.scroller, null)[vendor + 'Transform'].replace(/[^0-9-.,]/g, '').split(',');
				x = matrix[4] * 1;
				y = matrix[5] * 1;
			} else {
				x = getComputedStyle(that.scroller, null).left.replace(/[^0-9-]/g, '') * 1;
				y = getComputedStyle(that.scroller, null).top.replace(/[^0-9-]/g, '') * 1;
			}
			
			if (x != that.x || y != that.y) {
				if (that.options.useTransition) that._unbind('webkitTransitionEnd');
				else cancelFrame(that.aniTime);
				that.steps = [];
				that._pos(x, y);
			}
		}

		that.absStartX = that.x;	// Needed by snap threshold
		that.absStartY = that.y;

		that.startX = that.x;
		that.startY = that.y;
		that.pointX = point.pageX;
		that.pointY = point.pageY;

		that.startTime = e.timeStamp || Date.now();

		if (that.options.onScrollStart) that.options.onScrollStart.call(that, e);

		that._bind(MOVE_EV);
		that._bind(END_EV);
		that._bind(CANCEL_EV);
	},
	
	_move: function (e) {
		var that = this,
			point = hasTouch ? e.touches[0] : e,
			deltaX = point.pageX - that.pointX,
			deltaY = point.pageY - that.pointY,
			newX = that.x + deltaX,
			newY = that.y + deltaY,
			c1, c2, scale,
			timestamp = e.timeStamp || Date.now();

		if (that.options.onBeforeScrollMove) that.options.onBeforeScrollMove.call(that, e);

		// Zoom
		if (that.options.zoom && hasTouch && e.touches.length > 1) {
			c1 = m.abs(e.touches[0].pageX - e.touches[1].pageX);
			c2 = m.abs(e.touches[0].pageY - e.touches[1].pageY);
			that.touchesDist = m.sqrt(c1*c1+c2*c2);

			that.zoomed = true;

			scale = 1 / that.touchesDistStart * that.touchesDist * this.scale;

			if (scale < that.options.zoomMin) scale = 0.5 * that.options.zoomMin * Math.pow(2.0, scale / that.options.zoomMin);
			else if (scale > that.options.zoomMax) scale = 2.0 * that.options.zoomMax * Math.pow(0.5, that.options.zoomMax / scale);

			that.lastScale = scale / this.scale;

			newX = this.originX - this.originX * that.lastScale + this.x,
			newY = this.originY - this.originY * that.lastScale + this.y;

			this.scroller.style[vendor + 'Transform'] = trnOpen + newX + 'px,' + newY + 'px' + trnClose + ' scale(' + scale + ')';

			if (that.options.onZoom) that.options.onZoom.call(that, e);
			return;
		}

		that.pointX = point.pageX;
		that.pointY = point.pageY;

		// Slow down if outside of the boundaries
		if (newX > 0 || newX < that.maxScrollX) {
			newX = that.options.bounce ? that.x + (deltaX / 2) : newX >= 0 || that.maxScrollX >= 0 ? 0 : that.maxScrollX;
		}
		if (newY > that.minScrollY || newY < that.maxScrollY) { 
			newY = that.options.bounce ? that.y + (deltaY / 2) : newY >= that.minScrollY || that.maxScrollY >= 0 ? that.minScrollY : that.maxScrollY;
		}

		if (that.absDistX < 6 && that.absDistY < 6) {
			that.distX += deltaX;
			that.distY += deltaY;
			that.absDistX = m.abs(that.distX);
			that.absDistY = m.abs(that.distY);

			return;
		}

		// Lock direction
		if (that.options.lockDirection) {
			if (that.absDistX > that.absDistY + 5) {
				newY = that.y;
				deltaY = 0;
			} else if (that.absDistY > that.absDistX + 5) {
				newX = that.x;
				deltaX = 0;
			}
		}

		that.moved = true;
		that._pos(newX, newY);
		that.dirX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
		that.dirY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

		if (timestamp - that.startTime > 300) {
			that.startTime = timestamp;
			that.startX = that.x;
			that.startY = that.y;
		}
		
		if (that.options.onScrollMove) that.options.onScrollMove.call(that, e);
	},
	
	_end: function (e) {
		if (hasTouch && e.touches.length != 0) return;

		var that = this,
			point = hasTouch ? e.changedTouches[0] : e,
			target, ev,
			momentumX = { dist:0, time:0 },
			momentumY = { dist:0, time:0 },
			duration = (e.timeStamp || Date.now()) - that.startTime,
			newPosX = that.x,
			newPosY = that.y,
			distX, distY,
			newDuration,
			snap,
			scale;

		that._unbind(MOVE_EV);
		that._unbind(END_EV);
		that._unbind(CANCEL_EV);

		if (that.options.onBeforeScrollEnd) that.options.onBeforeScrollEnd.call(that, e);

		if (that.zoomed) {
			scale = that.scale * that.lastScale;
			scale = Math.max(that.options.zoomMin, scale);
			scale = Math.min(that.options.zoomMax, scale);
			that.lastScale = scale / that.scale;
			that.scale = scale;

			that.x = that.originX - that.originX * that.lastScale + that.x;
			that.y = that.originY - that.originY * that.lastScale + that.y;
			
			that.scroller.style[vendor + 'TransitionDuration'] = '200ms';
			that.scroller.style[vendor + 'Transform'] = trnOpen + that.x + 'px,' + that.y + 'px' + trnClose + ' scale(' + that.scale + ')';
			
			that.zoomed = false;
			that.refresh();

			if (that.options.onZoomEnd) that.options.onZoomEnd.call(that, e);
			return;
		}

		if (!that.moved) {
			if (hasTouch) {
				if (that.doubleTapTimer && that.options.zoom) {
					// Double tapped
					clearTimeout(that.doubleTapTimer);
					that.doubleTapTimer = null;
					if (that.options.onZoomStart) that.options.onZoomStart.call(that, e);
					that.zoom(that.pointX, that.pointY, that.scale == 1 ? that.options.doubleTapZoom : 1);
					if (that.options.onZoomEnd) {
						setTimeout(function() {
							that.options.onZoomEnd.call(that, e);
						}, 200); // 200 is default zoom duration
					}
				} else {
					that.doubleTapTimer = setTimeout(function () {
						that.doubleTapTimer = null;

						// Find the last touched element
						target = point.target;
						while (target.nodeType != 1) target = target.parentNode;

						if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA') {
							ev = document.createEvent('MouseEvents');
							ev.initMouseEvent('click', true, true, e.view, 1,
								point.screenX, point.screenY, point.clientX, point.clientY,
								e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
								0, null);
							ev._fake = true;
							target.dispatchEvent(ev);
						}
					}, that.options.zoom ? 250 : 0);
				}
			}

			that._resetPos(200);

			if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
			return;
		}

		if (duration < 300 && that.options.momentum) {
			momentumX = newPosX ? that._momentum(newPosX - that.startX, duration, -that.x, that.scrollerW - that.wrapperW + that.x, that.options.bounce ? that.wrapperW : 0) : momentumX;
			momentumY = newPosY ? that._momentum(newPosY - that.startY, duration, -that.y, (that.maxScrollY < 0 ? that.scrollerH - that.wrapperH + that.y - that.minScrollY : 0), that.options.bounce ? that.wrapperH : 0) : momentumY;

			newPosX = that.x + momentumX.dist;
			newPosY = that.y + momentumY.dist;

 			if ((that.x > 0 && newPosX > 0) || (that.x < that.maxScrollX && newPosX < that.maxScrollX)) momentumX = { dist:0, time:0 };
 			if ((that.y > that.minScrollY && newPosY > that.minScrollY) || (that.y < that.maxScrollY && newPosY < that.maxScrollY)) momentumY = { dist:0, time:0 };
		}

		if (momentumX.dist || momentumY.dist) {
			newDuration = m.max(m.max(momentumX.time, momentumY.time), 10);

			// Do we need to snap?
			if (that.options.snap) {
				distX = newPosX - that.absStartX;
				distY = newPosY - that.absStartY;
				if (m.abs(distX) < that.options.snapThreshold && m.abs(distY) < that.options.snapThreshold) { that.scrollTo(that.absStartX, that.absStartY, 200); }
				else {
					snap = that._snap(newPosX, newPosY);
					newPosX = snap.x;
					newPosY = snap.y;
					newDuration = m.max(snap.time, newDuration);
				}
			}

			that.scrollTo(m.round(newPosX), m.round(newPosY), newDuration);

			if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
			return;
		}

		// Do we need to snap?
		if (that.options.snap) {
			distX = newPosX - that.absStartX;
			distY = newPosY - that.absStartY;
			if (m.abs(distX) < that.options.snapThreshold && m.abs(distY) < that.options.snapThreshold) that.scrollTo(that.absStartX, that.absStartY, 200);
			else {
				snap = that._snap(that.x, that.y);
				if (snap.x != that.x || snap.y != that.y) that.scrollTo(snap.x, snap.y, snap.time);
			}

			if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
			return;
		}

		that._resetPos(200);
		if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
	},
	
	_resetPos: function (time) {
		var that = this,
			resetX = that.x >= 0 ? 0 : that.x < that.maxScrollX ? that.maxScrollX : that.x,
			resetY = that.y >= that.minScrollY || that.maxScrollY > 0 ? that.minScrollY : that.y < that.maxScrollY ? that.maxScrollY : that.y;

		if (resetX == that.x && resetY == that.y) {
			if (that.moved) {
				that.moved = false;
				if (that.options.onScrollEnd) that.options.onScrollEnd.call(that);		// Execute custom code on scroll end
			}

			if (that.hScrollbar && that.options.hideScrollbar) {
				if (vendor == 'webkit') that.hScrollbarWrapper.style[vendor + 'TransitionDelay'] = '300ms';
				that.hScrollbarWrapper.style.opacity = '0';
			}
			if (that.vScrollbar && that.options.hideScrollbar) {
				if (vendor == 'webkit') that.vScrollbarWrapper.style[vendor + 'TransitionDelay'] = '300ms';
				that.vScrollbarWrapper.style.opacity = '0';
			}

			return;
		}

		that.scrollTo(resetX, resetY, time || 0);
	},

	_wheel: function (e) {
		var that = this,
			wheelDeltaX, wheelDeltaY,
			deltaX, deltaY,
			deltaScale;

		if ('wheelDeltaX' in e) {
			wheelDeltaX = e.wheelDeltaX / 12;
			wheelDeltaY = e.wheelDeltaY / 12;
		} else if ('detail' in e) {
			wheelDeltaX = wheelDeltaY = -e.detail * 3;
		} else {
			wheelDeltaX = wheelDeltaY = -e.wheelDelta;
		}
		
		if (that.options.wheelAction == 'zoom') {
			deltaScale = that.scale * Math.pow(2, 1/3 * (wheelDeltaY ? wheelDeltaY / Math.abs(wheelDeltaY) : 0));
			if (deltaScale < that.options.zoomMin) deltaScale = that.options.zoomMin;
			if (deltaScale > that.options.zoomMax) deltaScale = that.options.zoomMax;
			
			if (deltaScale != that.scale) {
				if (!that.wheelZoomCount && that.options.onZoomStart) that.options.onZoomStart.call(that, e);
				that.wheelZoomCount++;
				
				that.zoom(e.pageX, e.pageY, deltaScale, 400);
				
				setTimeout(function() {
					that.wheelZoomCount--;
					if (!that.wheelZoomCount && that.options.onZoomEnd) that.options.onZoomEnd.call(that, e);
				}, 400);
			}
			
			return;
		}
		
		deltaX = that.x + wheelDeltaX;
		deltaY = that.y + wheelDeltaY;

		if (deltaX > 0) deltaX = 0;
		else if (deltaX < that.maxScrollX) deltaX = that.maxScrollX;

		if (deltaY > that.minScrollY) deltaY = that.minScrollY;
		else if (deltaY < that.maxScrollY) deltaY = that.maxScrollY;

		that.scrollTo(deltaX, deltaY, 0);
	},
	
	_mouseout: function (e) {
		var t = e.relatedTarget;

		if (!t) {
			this._end(e);
			return;
		}

		while (t = t.parentNode) if (t == this.wrapper) return;
		
		this._end(e);
	},

	_transitionEnd: function (e) {
		var that = this;

		if (e.target != that.scroller) return;

		that._unbind('webkitTransitionEnd');
		
		that._startAni();
	},


	/**
	 *
	 * Utilities
	 *
	 */
	_startAni: function () {
		var that = this,
			startX = that.x, startY = that.y,
			startTime = Date.now(),
			step, easeOut,
			animate;

		if (that.animating) return;
		
		if (!that.steps.length) {
			that._resetPos(400);
			return;
		}
		
		step = that.steps.shift();
		
		if (step.x == startX && step.y == startY) step.time = 0;

		that.animating = true;
		that.moved = true;
		
		if (that.options.useTransition) {
			that._transitionTime(step.time);
			that._pos(step.x, step.y);
			that.animating = false;
			if (step.time) that._bind('webkitTransitionEnd');
			else that._resetPos(0);
			return;
		}

		animate = function () {
			var now = Date.now(),
				newX, newY;

			if (now >= startTime + step.time) {
				that._pos(step.x, step.y);
				that.animating = false;
				if (that.options.onAnimationEnd) that.options.onAnimationEnd.call(that);			// Execute custom code on animation end
				that._startAni();
				return;
			}

			now = (now - startTime) / step.time - 1;
			easeOut = m.sqrt(1 - now * now);
			newX = (step.x - startX) * easeOut + startX;
			newY = (step.y - startY) * easeOut + startY;
			that._pos(newX, newY);
			if (that.animating) that.aniTime = nextFrame(animate);
		};

		animate();
	},

	_transitionTime: function (time) {
		time += 'ms';
		this.scroller.style[vendor + 'TransitionDuration'] = time;
		if (this.hScrollbar) this.hScrollbarIndicator.style[vendor + 'TransitionDuration'] = time;
		if (this.vScrollbar) this.vScrollbarIndicator.style[vendor + 'TransitionDuration'] = time;
	},

	_momentum: function (dist, time, maxDistUpper, maxDistLower, size) {
		var deceleration = 0.0006,
			speed = m.abs(dist) / time,
			newDist = (speed * speed) / (2 * deceleration),
			newTime = 0, outsideDist = 0;

		// Proportinally reduce speed if we are outside of the boundaries 
		if (dist > 0 && newDist > maxDistUpper) {
			outsideDist = size / (6 / (newDist / speed * deceleration));
			maxDistUpper = maxDistUpper + outsideDist;
			speed = speed * maxDistUpper / newDist;
			newDist = maxDistUpper;
		} else if (dist < 0 && newDist > maxDistLower) {
			outsideDist = size / (6 / (newDist / speed * deceleration));
			maxDistLower = maxDistLower + outsideDist;
			speed = speed * maxDistLower / newDist;
			newDist = maxDistLower;
		}

		newDist = newDist * (dist < 0 ? -1 : 1);
		newTime = speed / deceleration;

		return { dist: newDist, time: m.round(newTime) };
	},

	_offset: function (el) {
		var left = -el.offsetLeft,
			top = -el.offsetTop;
			
		while (el = el.offsetParent) {
			left -= el.offsetLeft;
			top -= el.offsetTop;
		}
		
		if (el != this.wrapper) {
			left *= this.scale;
			top *= this.scale;
		}

		return { left: left, top: top };
	},

	_snap: function (x, y) {
		var that = this,
			i, l,
			page, time,
			sizeX, sizeY;

		// Check page X
		page = that.pagesX.length - 1;
		for (i=0, l=that.pagesX.length; i<l; i++) {
			if (x >= that.pagesX[i]) {
				page = i;
				break;
			}
		}
		if (page == that.currPageX && page > 0 && that.dirX < 0) page--;
		x = that.pagesX[page];
		sizeX = m.abs(x - that.pagesX[that.currPageX]);
		sizeX = sizeX ? m.abs(that.x - x) / sizeX * 500 : 0;
		that.currPageX = page;

		// Check page Y
		page = that.pagesY.length-1;
		for (i=0; i<page; i++) {
			if (y >= that.pagesY[i]) {
				page = i;
				break;
			}
		}
		if (page == that.currPageY && page > 0 && that.dirY < 0) page--;
		y = that.pagesY[page];
		sizeY = m.abs(y - that.pagesY[that.currPageY]);
		sizeY = sizeY ? m.abs(that.y - y) / sizeY * 500 : 0;
		that.currPageY = page;

		// Snap with constant speed (proportional duration)
		time = m.round(m.max(sizeX, sizeY)) || 200;

		return { x: x, y: y, time: time };
	},

	_bind: function (type, el, bubble) {
		(el || this.scroller).addEventListener(type, this, !!bubble);
	},

	_unbind: function (type, el, bubble) {
		(el || this.scroller).removeEventListener(type, this, !!bubble);
	},


	/**
	 *
	 * Public methods
	 *
	 */
	destroy: function () {
		var that = this;

		that.scroller.style[vendor + 'Transform'] = '';

		// Remove the scrollbars
		that.hScrollbar = false;
		that.vScrollbar = false;
		that._scrollbar('h');
		that._scrollbar('v');

		// Remove the event listeners
		that._unbind(RESIZE_EV, window);
		that._unbind(START_EV);
		that._unbind(MOVE_EV);
		that._unbind(END_EV);
		that._unbind(CANCEL_EV);
		
		if (that.options.hasTouch) {
			that._unbind('mouseout', that.wrapper);
			that._unbind(WHEEL_EV);
		}
		
		if (that.options.useTransition) that._unbind('webkitTransitionEnd');
		
		if (that.options.checkDOMChanges) clearInterval(that.checkDOMTime);
		
		if (that.options.onDestroy) that.options.onDestroy.call(that);
	},

	refresh: function () {
		var that = this,
			offset,
			i, l,
			els,
			pos = 0,
			page = 0;

		if (that.scale < that.options.zoomMin) that.scale = that.options.zoomMin;
		that.wrapperW = that.wrapper.clientWidth || 1;
		that.wrapperH = that.wrapper.clientHeight || 1;

		that.minScrollY = -that.options.topOffset || 0;
		that.scrollerW = m.round(that.scroller.offsetWidth * that.scale);
		that.scrollerH = m.round((that.scroller.offsetHeight + that.minScrollY) * that.scale);
		that.maxScrollX = that.wrapperW - that.scrollerW;
		that.maxScrollY = that.wrapperH - that.scrollerH + that.minScrollY;
		that.dirX = 0;
		that.dirY = 0;

		if (that.options.onRefresh) that.options.onRefresh.call(that);

		that.hScroll = that.options.hScroll && that.maxScrollX < 0;
		that.vScroll = that.options.vScroll && (!that.options.bounceLock && !that.hScroll || that.scrollerH > that.wrapperH);

		that.hScrollbar = that.hScroll && that.options.hScrollbar;
		that.vScrollbar = that.vScroll && that.options.vScrollbar && that.scrollerH > that.wrapperH;

		offset = that._offset(that.wrapper);
		that.wrapperOffsetLeft = -offset.left;
		that.wrapperOffsetTop = -offset.top;

		// Prepare snap
		if (typeof that.options.snap == 'string') {
			that.pagesX = [];
			that.pagesY = [];
			els = that.scroller.querySelectorAll(that.options.snap);
			for (i=0, l=els.length; i<l; i++) {
				pos = that._offset(els[i]);
				pos.left += that.wrapperOffsetLeft;
				pos.top += that.wrapperOffsetTop;
				that.pagesX[i] = pos.left < that.maxScrollX ? that.maxScrollX : pos.left * that.scale;
				that.pagesY[i] = pos.top < that.maxScrollY ? that.maxScrollY : pos.top * that.scale;
			}
		} else if (that.options.snap) {
			that.pagesX = [];
			while (pos >= that.maxScrollX) {
				that.pagesX[page] = pos;
				pos = pos - that.wrapperW;
				page++;
			}
			if (that.maxScrollX%that.wrapperW) that.pagesX[that.pagesX.length] = that.maxScrollX - that.pagesX[that.pagesX.length-1] + that.pagesX[that.pagesX.length-1];

			pos = 0;
			page = 0;
			that.pagesY = [];
			while (pos >= that.maxScrollY) {
				that.pagesY[page] = pos;
				pos = pos - that.wrapperH;
				page++;
			}
			if (that.maxScrollY%that.wrapperH) that.pagesY[that.pagesY.length] = that.maxScrollY - that.pagesY[that.pagesY.length-1] + that.pagesY[that.pagesY.length-1];
		}

		// Prepare the scrollbars
		that._scrollbar('h');
		that._scrollbar('v');

		if (!that.zoomed) {
			that.scroller.style[vendor + 'TransitionDuration'] = '0';
			that._resetPos(200);
		}
	},

	scrollTo: function (x, y, time, relative) {
		var that = this,
			step = x,
			i, l;

		that.stop();

		if (!step.length) step = [{ x: x, y: y, time: time, relative: relative }];
		
		for (i=0, l=step.length; i<l; i++) {
			if (step[i].relative) { step[i].x = that.x - step[i].x; step[i].y = that.y - step[i].y; }
			that.steps.push({ x: step[i].x, y: step[i].y, time: step[i].time || 0 });
		}

		that._startAni();
	},

	scrollToElement: function (el, time) {
		var that = this, pos;
		el = el.nodeType ? el : that.scroller.querySelector(el);
		if (!el) return;

		pos = that._offset(el);
		pos.left += that.wrapperOffsetLeft;
		pos.top += that.wrapperOffsetTop;

		pos.left = pos.left > 0 ? 0 : pos.left < that.maxScrollX ? that.maxScrollX : pos.left;
		pos.top = pos.top > that.minScrollY ? that.minScrollY : pos.top < that.maxScrollY ? that.maxScrollY : pos.top;
		time = time === undefined ? m.max(m.abs(pos.left)*2, m.abs(pos.top)*2) : time;

		that.scrollTo(pos.left, pos.top, time);
	},

	scrollToPage: function (pageX, pageY, time) {
		var that = this, x, y;

		if (that.options.onScrollStart) that.options.onScrollStart.call(that);

		if (that.options.snap) {
			pageX = pageX == 'next' ? that.currPageX+1 : pageX == 'prev' ? that.currPageX-1 : pageX;
			pageY = pageY == 'next' ? that.currPageY+1 : pageY == 'prev' ? that.currPageY-1 : pageY;

			pageX = pageX < 0 ? 0 : pageX > that.pagesX.length-1 ? that.pagesX.length-1 : pageX;
			pageY = pageY < 0 ? 0 : pageY > that.pagesY.length-1 ? that.pagesY.length-1 : pageY;

			that.currPageX = pageX;
			that.currPageY = pageY;
			x = that.pagesX[pageX];
			y = that.pagesY[pageY];
		} else {
			x = -that.wrapperW * pageX;
			y = -that.wrapperH * pageY;
			if (x < that.maxScrollX) x = that.maxScrollX;
			if (y < that.maxScrollY) y = that.maxScrollY;
		}

		that.scrollTo(x, y, time || 400);
	},

	disable: function () {
		this.stop();
		this._resetPos(0);
		this.enabled = false;

		// If disabled after touchstart we make sure that there are no left over events
		this._unbind(MOVE_EV);
		this._unbind(END_EV);
		this._unbind(CANCEL_EV);
	},
	
	enable: function () {
		this.enabled = true;
	},
	
	stop: function () {
		if (this.options.useTransition) this._unbind('webkitTransitionEnd');
		else cancelFrame(this.aniTime);
		this.steps = [];
		this.moved = false;
		this.animating = false;
	},
	
	zoom: function (x, y, scale, time) {
		var that = this,
			relScale = scale / that.scale;

		if (!that.options.useTransform) return;

		that.zoomed = true;
		time = time === undefined ? 200 : time;
		x = x - that.wrapperOffsetLeft - that.x;
		y = y - that.wrapperOffsetTop - that.y;
		that.x = x - x * relScale + that.x;
		that.y = y - y * relScale + that.y;

		that.scale = scale;
		that.refresh();

		that.x = that.x > 0 ? 0 : that.x < that.maxScrollX ? that.maxScrollX : that.x;
		that.y = that.y > that.minScrollY ? that.minScrollY : that.y < that.maxScrollY ? that.maxScrollY : that.y;

		that.scroller.style[vendor + 'TransitionDuration'] = time + 'ms';
		that.scroller.style[vendor + 'Transform'] = trnOpen + that.x + 'px,' + that.y + 'px' + trnClose + ' scale(' + scale + ')';
		that.zoomed = false;
	},
	
	isReady: function () {
		return !this.moved && !this.zoomed && !this.animating;
	}
};

if (typeof exports !== 'undefined') exports.iScroll = iScroll;
else window.iScroll = iScroll;

})();


/*
---

name: Browser.Platform

description: Provides extra indication about the current platform.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Browser

provides:
	- Browser.Platform

...
*/

Browser.Platform.phonegap =
	window.device &&
	window.device.phonegap;

/*
---

name: Class.Instanciate

description: Provides a method to instanciate classes based on the class name
             stored as a string.

license: MIT-style license.

requires:
	- Core/Class

provides:
	- Class.Instanciate

...
*/

Class.extend({

	parse: function(name) {
		name = name.trim();
		name = name.split('.');
		var func = window;
		for (var i = 0; i < name.length; i++) if (func[name[i]]) func = func[name[i]]; else return null;
		return typeof func == 'function' ? func : null;
	},

	instanciate: function(klass) {
		if (typeof klass == 'string') klass = Class.parse(klass);
		if (klass == null) return null;
		klass.$prototyping = true;
		var instance = new klass;
		delete klass.$prototyping;
		var params = Array.prototype.slice.call(arguments, 1);
		if (instance.initialize) {
			instance.initialize.apply(instance, params);
		}
		return instance;
	}

});



/*
---

name: String.Extras

description: Provides extra methods to String.

license: MIT-style license.

requires:
	- Core/String

provides:
	- String.Extras

...
*/

String.implement({

	toJSONString: function() {
		return '{' + this.toString() + '}';
	},

	toJSONObject: function() {
		return JSON.decode(this.toJSONString());
	},

	toCamelCase: function() {
		return this.camelCase().replace('-', '').replace(/\s\D/g, function(match){
            return match.charAt(1).toUpperCase();
        });
	}

});



/*
---

name: Object.Extras

description: Provides extra methods to Object.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Object
	- String.Extras

provides:
	- Object.Extras

...
*/

Object.extend({

	defineMember: function(source, reference, name, readonly) {
		if (name) {
			var member = name.toCamelCase();
			if (source[member] == null || source[member] == undefined) {
				source[member] = reference;
				var getter = 'get' + member.capitalize();
				var setter = 'set' + member.capitalize();
				if (source[getter] == undefined) {
					source[getter] = function() {
						return this[member];
					}.bind(source);
				}
				if (source[setter] && !readonly) {
					source[setter] = function(value) {
						this[member] = value;
						return this;
					}.bind(source);
				}
			}
		}
		return source;
	}

})

/*
---

name: Array.Extras

description: Provides extra methods to the array object.

license: MIT-style license.

requires:
	- Core/Array

provides:
	- Array.Extras

...
*/

Array.implement({

	find: function(fn) {
		for (var i = 0; i < this.length; i++) {
			var found = fn.call(this, this[i]);
			if (found == true) {
				return this[i];
			}
		}
		return null;
	},
	
	lastItemAt: function(offset) {
		offset = offset ? offset : 0;
		return this[this.length - 1 - offset] ?
			   this[this.length - 1 - offset] :
			   null;
	}	
});

/*
---

name: Element.Styles

description: Provides new methods to Element.Styles.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	Core/Element
	Core/Element.Style

provides:
	- Element.Styles

...
*/

Element.implement({

	removeStyle: function(style) {
		this.setStyle(style, null);
		return this;
	},

	removeStyles: function(styles) {
		for (var style in styles) this.removeStyle(style, styles[style]);
		return this;
	}

});

/*
---

name: Element.Ingest

description: Provides an ingest method that creates child dom element based on
             a string.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	Core/Element

provides:
	- Element.Ingest

...
*/



Element.implement({

	ingest: function(element) {

		this.empty();

		var type = typeOf(element);
		if (type == 'element') {
			this.adopt(Array.from(element.childNodes));
			return this;
		}

		if (type == 'string') {
			var match = element.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
			if (match) element = match[1];
			this.set('html', element);
		}

		return this;
	}

});

/*
---

name: Element.Properties.Name

description: Provides a name element properties.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	Core/Element

provides:
	- Element.Properties.Name

...
*/

Element.Properties.name = {

	set: function(name) {

		var role = this.get('data-role');
		if (role) {
			return this.set('data-name', name);
		}

		return this.setProperty('name', name);
	},

	get: function() {

		var role = this.get('data-role');
		if (role) {
			return this.get('data-name');
		}

		return this.getProperty(name);
	}

};

/*
---

name: Element.Properties.Role

description: Provides a role element properties.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Element

provides:
	- Element.Properties.Role

...
*/

Element.Properties.role={

	get: function() {

		var role = this.get('data-role');
		if (role == null)
			return null;

		role = role.trim();
		role = role.toLowerCase();

		var object = Moobile.View.Roles[role] || null;
		if (object) {
			object.name = role;
		}

		return object;
	},

	set: function(value) {
		this.set('data-role', value);
	}

};

/*
---

name: Element.Properties.Options

description: Provides an options element properties.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	Core/Element

provides:
	- Element.Properties.Options

...
*/

Element.Properties.options = {

	get: function() {
		var options = this.get('data-options');
		if (options) {
			if (!options.match(/^\{/)) options = '{' + options;
			if (!options.match(/\}$/)) options = options + '}';
			options = JSON.decode(options);
		}
		return options;
	}


};

/*
---

name: Element.defineCustomEvent

description: Allows to create custom events based on other custom events.

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Element.Event]

provides: Element.defineCustomEvent

...
*/

(function(){

[Element, Window, Document].invoke('implement', {hasEvent: function(event){
	var events = this.retrieve('events'),
		list = (events && events[event]) ? events[event].values : null;
	if (list){
		for (var i = list.length; i--;) if (i in list){
			return true;
		}
	}
	return false;
}});

var wrap = function(custom, method, extended, name){
	method = custom[method];
	extended = custom[extended];

	return function(fn, customName){
		if (!customName) customName = name;

		if (extended && !this.hasEvent(customName)) extended.call(this, fn, customName);
		if (method) method.call(this, fn, customName);
	};
};

var inherit = function(custom, base, method, name){
	return function(fn, customName){
		base[method].call(this, fn, customName || name);
		custom[method].call(this, fn, customName || name);
	};
};

var events = Element.Events;

Element.defineCustomEvent = function(name, custom){

	var base = events[custom.base];

	custom.onAdd = wrap(custom, 'onAdd', 'onSetup', name);
	custom.onRemove = wrap(custom, 'onRemove', 'onTeardown', name);

	events[name] = base ? Object.append({}, custom, {

		base: base.base,

		condition: function(event){
			return (!base.condition || base.condition.call(this, event)) &&
				(!custom.condition || custom.condition.call(this, event));
		},

		onAdd: inherit(custom, base, 'onAdd', name),
		onRemove: inherit(custom, base, 'onRemove', name)

	}) : custom;

	return this;

};

var loop = function(name){
	var method = 'on' + name.capitalize();
	Element[name + 'CustomEvents'] = function(){
		Object.each(events, function(event, name){
			if (event[method]) event[method].call(event, name);
		});
	};
	return loop;
};

loop('enable')('disable');

})();


/*
---

name: Browser.Mobile

description: Provides useful information about the browser environment

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Browser]

provides: Browser.Mobile

...
*/

(function(){

Browser.Device = {
	name: 'other'
};

if (Browser.Platform.ios){
	var device = navigator.userAgent.toLowerCase().match(/(ip(ad|od|hone))/)[0];
	
	Browser.Device[device] = true;
	Browser.Device.name = device;
}

if (this.devicePixelRatio == 2)
	Browser.hasHighResolution = true;

Browser.isMobile = !['mac', 'linux', 'win'].contains(Browser.Platform.name);

}).call(this);


/*
---

name: Event.Mobile

description: Translate desktop events to mobile event correctly.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Event
	- Core/Element.Event
	- Custom-Event/Element.defineCustomEvent
	- Mobile/Browser.Mobile

provides:
	- Event.Mobile

...
*/

if (Browser.isMobile) {

	delete Element.NativeEvents['mousedown'];
	delete Element.NativeEvents['mousemove'];
	delete Element.NativeEvents['mouseup'];

	Element.defineCustomEvent('mousedown', {
		base: 'touchstart'
	});

	Element.defineCustomEvent('mousemove', {
		base: 'touchmove'
	});

	Element.defineCustomEvent('mouseup', {
		base: 'touchend'
	});

}

/*
---

name: Event.Ready

description: Provides an event that indicates the app is loaded. This event is
             based on the domready event or other third party events such as
			 deviceready on phonegap.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Event
	- Core/Element.Event
	- Core/DOMReady
	- Custom-Event/Element.defineCustomEvent
	- Browser.Platform

provides:
	- Event.Ready

...
*/

(function() {

	Element.NativeEvents.deviceready = 1;

	var domready = Browser.Platform.phonegap ? 'deviceready' : 'domready';

	var onReady = function(e) {
		this.fireEvent('ready');
	};

	Element.defineCustomEvent('ready', {

		onSetup: function(){
			this.addEvent(domready, onReady);
		},

		onTeardown: function(){
			this.removeEvent(domready, onReady);
		}

	});

})();




/*
---

name: Browser.Features.Touch

description: Checks whether the used Browser has touch events

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Browser]

provides: Browser.Features.Touch

...
*/

Browser.Features.Touch = (function(){
	try {
		document.createEvent('TouchEvent').initTouchEvent('touchstart');
		return true;
	} catch (exception){}
	
	return false;
})();

// Chrome 5 thinks it is touchy!
// Android doesn't have a touch delay and dispatchEvent does not fire the handler
Browser.Features.iOSTouch = (function(){
	var name = 'cantouch', // Name does not matter
		html = document.html,
		hasTouch = false;

	var handler = function(){
		html.removeEventListener(name, handler, true);
		hasTouch = true;
	};

	try {
		html.addEventListener(name, handler, true);
		var event = document.createEvent('TouchEvent');
		event.initTouchEvent(name);
		html.dispatchEvent(event);
		return hasTouch;
	} catch (exception){}

	handler(); // Remove listener
	return false;
})();


/*
---

name: Touch

description: Provides a custom touch event on mobile devices

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Element.Event, Custom-Event/Element.defineCustomEvent, Browser.Features.Touch]

provides: Touch

...
*/

(function(){

var preventDefault = function(event){
	event.preventDefault();
};

var disabled;

Element.defineCustomEvent('touch', {

	base: 'touchend',

	condition: function(event){
		if (disabled || event.targetTouches.length != 0) return false;

		var touch = event.changedTouches[0],
			target = document.elementFromPoint(touch.clientX, touch.clientY);

		do {
			if (target == this) return true;
		} while ((target = target.parentNode) && target);

		return false;
	},

	onSetup: function(){
		this.addEvent('touchstart', preventDefault);
	},

	onTeardown: function(){
		this.removeEvent('touchstart', preventDefault);
	},

	onEnable: function(){
		disabled = false;
	},

	onDisable: function(){
		disabled = true;
	}

});

})();


/*
---

name: Click

description: Provides a replacement for click events on mobile devices

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Touch]

provides: Click

...
*/

if (Browser.Features.iOSTouch) (function(){

var name = 'click';
delete Element.NativeEvents[name];

Element.defineCustomEvent(name, {

	base: 'touch'

});

})();


/*
---

name: Event.Click

description: Provides a click event that is not triggered when the user clicks
             and moves the mouse. This overrides the default click event. It's
			 important to include Mobile/Click before this class otherwise the
			 click event will be deleted.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Event
	- Core/Element.Event
	- Custom-Event/Element.defineCustomEvent
	- Mobile/Browser.Mobile
	- Mobile/Click
	- Mobile/Touch
	- Event.Mobile

provides:
	- Event.Click

...
*/

(function(){

	var x = 0;
	var y = 0;
	var down = false;
	var valid = true;

	var onMouseDown = function(e) {
		valid = true;
		down = true;
		x = e.page.x;
		y = e.page.y;
	};

	var onMouseMove = function(e) {
		if (down) {
			valid = !moved(e);
			if (valid == false) {
				this.removeEvent('mouseup', onMouseUp).fireEvent('mouseup', e).addEvent('mouseup', onMouseUp);
			}
		}
	};

	var onMouseUp = function(e) {
		if (down) {
			down = false;
			valid = !moved(e);
		}
	};

	var moved = function(e) {
		var xmax = x + 5;
		var xmin = x - 5;
		var ymax = y + 5;
		var ymin = y - 5;
		return (e.page.x > xmax || e.page.x < xmin || e.page.y > ymax || e.page.y < ymin);
	};

	Element.defineCustomEvent('click', {

		base: 'click',

		onAdd: function() {
			this.addEvent('mousedown', onMouseDown);
			this.addEvent('mousemove', onMouseMove);
			this.addEvent('mouseup', onMouseUp);
		},

		onRemove: function() {
			this.removeEvent('mousedown', onMouseDown);
			this.removeEvent('mousemove', onMouseMove);
			this.removeEvent('mouseup', onMouseUp);
		},

		condition: function(e) {
			return valid;
		}

	});

})();

/*
---

name: Event.CSS3

description: Provides CSS3 events.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Event
	- Core/Element
	- Core/Element.Event

provides:
	- Event.CSS3

...
*/

(function() {

	/* vendor prefix */

	var prefix = '';
	if (Browser.safari || Browser.chrome || Browser.Platform.ios) {
		prefix = 'webkit';
	} else if (Browser.firefox) {
		prefix = 'Moz';
	} else if (Browser.opera) {
		prefix = 'o';
	} else if (Browser.ie) {
		prefix = 'ms';
	}

	/* events */

	Element.NativeEvents[prefix + 'TransitionEnd'] = 2;
	Element.Events.transitionend = { base: (prefix + 'TransitionEnd') };

	Element.NativeEvents[prefix + 'AnimationEnd'] = 2;
	Element.Events.animationend = { base: (prefix + 'AnimationEnd') };

})();



/*
---

name: Event.ViewLoad

description: Provide an element that will be automatically fired when added
             after being fired for the first time.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Event
	- Core/Element.Event
	- Custom-Event/Element.defineCustomEvent

provides:
	- Event.ViewLoad

...
*/

(function() {

var executed = false;

Element.defineCustomEvent('viewload', {

	condition: function(e) {
		executed = true;
		return true;
	},

	onSetup: function() {
		if (executed) {
			this.fireEvent('viewload');
		}
	}

});

})();

/*
---

name: Event.ViewReady

description: Provide an element that will be automatically fired when added
             after being fired for the first time.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Event
	- Core/Element.Event
	- Custom-Event/Element.defineCustomEvent

provides:
	- Event.ViewReady

...
*/

(function() {

var executed = false;

Element.defineCustomEvent('viewready', {

	condition: function(e) {
		executed = true;
		return true;
	},

	onSetup: function() {
		if (executed) {
			this.fireEvent('viewready');
		}
	}

});

})();

/*
---

name: Class.Binds

description: A clean Class.Binds Implementation

authors: Scott Kyle (@appden), Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Class, Core/Function]

provides: Class.Binds

...
*/

Class.Binds = new Class({

	$bound: {},

	bound: function(name){
		return this.$bound[name] ? this.$bound[name] : this.$bound[name] = this[name].bind(this);
	}

});

/*
---

name: Request

description: Provides a base class for ajax request.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Class
	- Core/Class.Extras
	- Core/Request
	- Class-Extras/Class.Binds

provides:
	- Request

...
*/

if (!window.Moobile) window.Moobile = {};

Moobile.Request = new Class({

	Extends: Request,

	Implements: [
		Class.Binds
	],

	options: {
		isSuccess: function() {
			var status = this.status;
			return (status == 0 || (status >= 200 && status < 300));
		}
	}

});

/*
---

name: Request.View

description: Provides a method to load a view element from a remote location.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Event
	- Core/Element
	- Core/Element.Event
	- More/Events.Pseudos
	- Element.Extras
	- Request

provides:
	- Request.ViewController

...
*/

Moobile.Request.View = new Class({

	Extends: Moobile.Request,

	cache: {},

	options: {
		method: 'get'
	},

	initialize: function(options) {
		this.parent(options);
		this.attachEvents();
		return this;
	},

	attachEvents: function() {
		this.addEvent('success', this.bound('onViewLoad'));
		return this;
	},

	detachEvents: function() {
		this.removeEvent('success', this.bound('onViewLoad'));
		return this;
	},

	setCache: function(url, viewController) {
		this.cache[url] = viewController;
		return this;
	},

	getCache: function(url) {
		return this.hasCache(url) ? this.cache[url] : null;
	},

	hasCache: function(url) {
		return this.cache[url] && this.cache[url].isStarted();
	},

	load: function(url, callback) {

		var viewElement = this.getCache(url);
		if (viewElement) {
			callback.call(this, viewElement);
			return this;
		}

		this.addEvent('load:once', callback);
		this.setCache(url, null);
		this.options.url = url;
		this.send();

		return this;
	},

	onViewLoad: function(response) {

		var viewElement = new Element('div').ingest(response).getElement('[data-role=view]');
		if (viewElement) {
			this.setCache(this.options.url, viewElement);
			this.fireEvent('load', viewElement);
			return this;
		}

		throw new Error('Cannot find a data-role=view element from the response');

		return this;
	}

});

/*
---

name: Class.Singleton

description: Beautiful Singleton Implementation that is per-context or per-object/element

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Class]

provides: Class.Singleton

...
*/

(function(){

var storage = {

	storage: {},

	store: function(key, value){
		this.storage[key] = value;
	},

	retrieve: function(key){
		return this.storage[key] || null;
	}

};

Class.Singleton = function(){
	this.$className = String.uniqueID();
};

Class.Singleton.prototype.check = function(item){
	if (!item) item = storage;

	var instance = item.retrieve('single:' + this.$className);
	if (!instance) item.store('single:' + this.$className, this);
	
	return instance;
};

var gIO = function(klass){

	var name = klass.prototype.$className;

	return name ? this.retrieve('single:' + name) : null;

};

if (('Element' in this) && Element.implement) Element.implement({getInstanceOf: gIO});

Class.getInstanceOf = gIO.bind(storage);

}).call(this);

/*
---

name: View

description: Provides an element on the screen and the interfaces for managing
             the content in that area.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Class
	- Core/Class.Extras
	- Core/Array
	- Core/String
	- Core/Number
	- Core/Function
	- Core/Object
	- Core/Event
	- Core/DOMReady
	- Core/Element
	- Core/Element.Style
	- Core/Element.Event
	- Core/Element.Dimensions
	- More/Element.Shortcuts
	- Class-Extras/Class.Binds
	- Class-Extras/Class.Singleton
	- Event.ViewLoad
	- Event.ViewReady
	- Object.Extras
	- Element.Properties.Name
	- Element.Properties.Role
	- Element.Properties.Options
	- Element.Ingest
	- Element.Styles
	- String.Extras
	- Array.Extras
	- Class.Instanciate

provides:
	- View

...
*/

if (!window.Moobile) window.Moobile = {};

Moobile.View = new Class({

	Implements: [
		Events,
		Options,
		Class.Binds
	],

	window: null,

	name: null,

	ready: null,

	element: null,

	content: null,

	childViews: [],

	parentView: null,

	options: {
		className: 'view'
	},

	initialize: function(element, options, name) {

		this.setOptions(options);

		this.name = name || null;

		this.build(element);

		return this;
	},

	build: function(element) {

		this.element = document.id(element) || new Element('div');

		this.element.set('role', 'view');

		var content = this.getElement('[data-role=content]');
		if (content == null) {
			content = new Element('div[data-role=content]');
			content.ingest(this.element);
			content.inject(this.element);
		}

		this.content = content;

		var className = this.options.className;
		if (className) {
			this.element.addClass(className);
			this.content.addClass(className + '-content');
		}

		return this;
	},

	startup: function() {

		if (this.ready == true)
			return this;

		this.ready = true;

		this.attachRoleElements();
		this.init();
		this.attachEvents();

		return this;
	},

	destroy: function() {

		if (this.ready == false)
			return this;

		this.detachRoleElements();
		this.detachEvents();
		this.destroyChildViews();
		this.release();

		this.removeFromParentView();

		this.element.destroy();
		this.element = null;
		this.content = null;
		this.window = null;

		this.ready = false;

		return this;
	},

	init: function() {
		return this;
	},

	release: function() {
		return this;
	},

	attachEvents: function() {
		this.element.addEvent('swipe', this.bound('onViewSwipe'));
		this.element.addEvent('click', this.bound('onViewClick'));
		this.element.addEvent('mouseup', this.bound('onViewMouseUp'))
		this.element.addEvent('mousedown', this.bound('onViewMouseDown'));
		return this;
	},

	detachEvents: function() {
		this.element.removeEvent('swipe', this.bound('onViewSwipe'));
		this.element.removeEvent('click', this.bound('onViewClick'));
		this.element.removeEvent('mouseup', this.bound('onViewMouseUp'));
		this.element.removeEvent('mousedown', this.bound('onViewMouseDown'));
		return this;
	},

	attachRoleElements: function() {
		this.getElements('[data-role]').each(this.bound('attachRoleElement'));
		return this;
	},

	attachRoleElement: function(element) {
		var role = element.get('role');
		if (role) {

			var instance = this.getRoleInstance(element);
			if (instance instanceof Moobile.View) {
				this.addChildView(instance);
			}

			if (role.onAttach) {
				role.onAttach.call(element);
			}
		}
		return this;
	},

	detachRoleElements: function() {
		this.getElements('[data-role]').each(this.bound('detachRoleElement'));
		return this;
	},

	detachRoleElement: function(element) {
		var role = element.get('role');
		if (role) {
			if (role.onDetach) {
				role.onDetach.call(element);
			}
		}
		return this;
	},

	getRoleInstance: function(element) {

		var role = element.get('role');
		if (role) {
			var instance = element.retrieve('moobile:role-instance');
			if (instance == null) {
				if (role.apply) {
					instance = role.apply.call(element);
					element.store('moobile:role-instance', instance);
				}
			}
			return instance;
		}

		return null;
	},

	addChildView: function(view, where, context) {

		var exists = this.childViews.contains(view);
		if (exists == true)
			return this;

		var element = view.getElement();

		this.willAddChildView(view);
		view.parentViewWillChange(this);
		view.setParentView(this);
		view.setWindow(this.window);
		this.childViews.push(view);

		var contains = this.element.contains(element);
		if (contains == false) {
			if (context) {
				element.inject(context, where);
			} else {
				switch (where) {
					case 'header': this.element.grab(element, 'top');    break;
					case 'footer': this.element.grab(element, 'bottom'); break;
					default:	   this.content.grab(element, where);	 break;
				}
			}
		}

		view.parentViewDidChange(this);
		view.startup();
		this.didAddChildView(view);

		Object.defineMember(this, view, view.name);

		return this;
	},

	getChildView: function(name) {
		return this.childViews.find(function(childView) {
			return childView.getName() == name;
		});
	},

	getChildViewAt: function(index) {
		return this.childViews[index] || null;
	},

	replaceChildView: function(replace, view) {
		return this.addChildView(view, 'before', replace).removeChildView(replace);
	},

	removeChildView: function(view) {

		var exists = this.childViews.contains(view);
		if (exists == false)
			return this;

		var element = view.getElement();

		this.willRemoveChildView(view);
		view.parentViewWillChange(null);
		view.setParentView(null);
		view.setWindow(null);
		view.parentViewDidChange(null);
		element.dispose();
		this.childViews.erase(view);
		this.didRemoveChildView(view);

		return this;
	},

	removeFromParentView: function() {
		var parent = this.parentView || this.window;
		if (parent) parent.removeChildView(this);
		return this;
	},

	destroyChildViews: function() {
		this.childViews.each(this.bound('destroyChildView'));
		this.childViews.empty();
		return this;
	},

	destroyChildView: function(view) {
		view.destroy();
		view = null;
		return this;
	},

	show: function() {
		this.willShow();
		this.element.show();
		this.didShow();
		return this;
	},

	hide: function() {
		this.willHide();
		this.element.hide();
		this.didHide();
		return this;
	},

	setWindow: function(window) {
		this.window = window;
		return this;
	},

	getWindow: function(window) {
		return this.window;
	},

	getName: function() {
		return this.name;
	},

	isReady: function() {
		return this.ready;
	},

	getElement: function(selector) {
		return selector ? this.element.getElements(selector)[0] || null : this.element;
	},

	getElements: function(selector) {
		return this.element.getElements(selector).filter(this.bound('filterElement'));
	},

	filterElement: function(element) {

		var roles = [];

		var keys = Moobile.View.Roles;
		for (var key in keys) {
			if (keys[key].stop) roles.push(key);
		}

		var parent = element.getParent('[data-role]');
		while (true) {

			if (parent == null) {
				return true
			}

			var role = parent.get('role');
			if (role && role.stop) {
				if (roles.contains(role.name)) {
					return parent === this.element;
				}
			}

			parent = parent.getParent('[data-role]');
		}

		return false;
	},

	getContent: function() {
		return this.content;
	},

	setParentView: function(parentView) {
		this.parentView = parentView;
		return this;
	},

	getParentView: function() {
		return this.parentView;
	},

	getChildViews: function() {
		return this.childViews;
	},

	get: function(name) {
		return this.element.get(name);
	},

	set: function(name, value) {
		this.element.set(name, value);
		return this;
	},

	addClass: function(name) {
		this.element.addClass(name);
		return this;
	},

	removeClass: function(name) {
		this.element.removeClass(name);
		return this;
	},

	toggleClass: function(name) {
		this.element.toggleClass(name);
		return this;
	},

	setStyle: function(style, value) {
		this.element.setStyle(style, value);
		return this;
	},

	setStyles: function(styles) {
		this.element.setStyles(styles);
		return this;
	},

	getStyle: function(style) {
		return this.element.getStyle(style);
	},

	getStyles: function(styles) {
		return this.element.getStyles(styles);
	},

	removeStyle: function(style) {
		this.element.removeStyle(style);
		return this;
	},

	removeStyles: function(styles) {
		this.element.removeStyles(styles);
		return this;
	},

	getSize: function() {
		return this.element.getSize();
	},

	parentViewWillChange: function(parentView) {
		return this;
	},

	parentViewDidChange: function(parentView) {
		return this;
	},

	willAddChildView: function(childView) {
		return this;
	},

	didAddChildView: function(childView) {
		return this;
	},

	willRemoveChildView: function(childView) {
		return this;
	},

	didRemoveChildView: function(childView) {
		return this;
	},

	willAddChildElement: function(childElement) {
		return this;
	},

	didAddChildElement: function(childElement) {
		return this;
	},

	willRemoveChildElement: function(childElement) {
		return this;
	},

	didRemoveChildElement: function(childElement) {
		return this;
	},

	willShow: function() {
		return this;
	},

	didShow: function() {
		return this;
	},

	willHide: function() {
		return this;
	},

	didHide: function() {
		return this;
	},

	onViewSwipe: function(e) {
		e.target = this;
		this.fireEvent('swipe', e);
		return this;
	},

	onViewClick: function(e) {
		e.target = this;
		this.fireEvent('click', e);
		return this;
	},

	onViewMouseUp: function(e) {
		e.target = this;
		this.fireEvent('mouseup', e);
		return this;
	},

	onViewMouseDown: function(e) {
		e.target = this;
		this.fireEvent('mousedown', e);
		return this;
	},

	toElement: function() {
		return this.element;
	}

});

/*
---

name: Control

description: Provides the base class for any types of controls.

license: MIT-style license.

requires:
	- View

provides:
	- Control

...
*/

if (!window.Moobile) window.Moobile = {};

Moobile.Control = new Class({

	Extends: Moobile.View,

	style: null,

	disabled: false,

	selected: false,

	selectable: true,

	highlighted: false,

	highlightable: true,

	options: {
		className: null,
		styleName: null,
		disabled: false,
		selected: false,
		selectable: true,
		highlighted: false,
		highlightable: true
	},

	initialize: function(element, options, name) {

		this.parent(element, options, name);

		var styleName = this.options.styleName;
		if (styleName) {
			this.setStyle(styleName);
		}
		
		return this;
	},

	build: function(element) {

		this.parent(element);

		this.element.set('role', 'control');

		if (this.options.disabled) this.setDisabled(true);
		if (this.options.selected) this.setSelected(true);
		if (this.options.highlighted) this.options.setHighlighted(true);

		if (!this.options.selectable) this.setSelectable(false);
		if (!this.options.highlightable) this.setHighlightable(false);

		return this;
	},

	setStyle: function(style, value) {

		if (typeof style == 'object') {

			if (this.style == style)
				return this;

			if (this.style) {
				if (this.style.onDetach) {
					this.style.onDetach.call(this);
				}
			}

			this.style = null;

			if (style) {
				this.style = style;
				if (this.style.onAttach) {
					this.style.onAttach.call(this);
				}
			}

			return this;
		}

		return this.parent(style, value);
	},

	getStyle: function(style) {
		return style ? this.parent(style) : this.style;
	},

	setDisabled: function(disabled) {
		return this._setState('disabled', disabled);
	},

	isDisabled: function() {
		return this._getState('disabled');
	},

	setSelected: function(selected) {
		return this.selectable ? this._setState('selected', selected) : this;
	},

	isSelected: function() {
		return this._getState('selected');
	},

	setSelectable: function(selectable) {
		this.selectable = selectable;
		return this;
	},

	isSelectable: function() {
		return this.selectable;
	},

	setHighlighted: function(highlighted) {
		return this.highlightable ? this._setState('highlighted', highlighted) : this;
	},

	isHighlighted: function() {
		return this._getState('highlighted');
	},

	setHighlightable: function(highlightable) {
		this.highlightable = highlightable;
	},

	isHighlightable: function() {
		return this.highlightable;
	},

	_setState: function(state, value) {

		if (this[state] == value)
			return this;

		this[state] = value;

		var klass = this.options.className + '-' + state;
		if (value)	this.addClass(klass);
		else		this.removeClass(klass);

		this.fireEvent('statechange', [state, value]);

		return this;
	},

	_getState: function(state) {
		return this.states[state] || false;
	}

});

/*
---

name: ButtonStyle

description: Provide constants for button styles.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:

provides:
	- ButtonStyle

...
*/

if (!window.Moobile) window.Moobile = {};

Moobile.ButtonStyle = {

	Default: {

		onAttach: function() {
			return this.addClass('style-default');
		},

		onDetach: function() {
			return this.removeClass('style-default');
		}

	}

};


/*
---

name: Button

description: Provides a button.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Control
	- ButtonStyle

provides:
	- Button

...
*/

Moobile.Button = new Class({

	Extends: Moobile.Control,

	label: null,

	options: {
		className: 'button',
		styleName: Moobile.ButtonStyle.Default
	},

	build: function(element) {

		this.parent(element);

		var label = this.getElement('[data-role=label]');
		if (label == null) {
			label = new Element('div[data-role=label]');
			label.ingest(this.content);
			label.inject(this.content);
		}

		this.label = this.getRoleInstance(label);

		return this;
	},

	setLabel: function(label) {

		if (this.label == label)
			return this;

		this.label.setText(null);
		this.label.hide();

		if (label) {

			var type = typeOf(label);
			if (type == 'string') {
				this.label.setText(label);
				this.label.show();
				return this;
			}

			if (type == 'element') {
				label = new Moobile.Label(label);
			}

			this.replaceChildView(this.label, label);
			this.label.destroy();
			this.label = label;
		}

		return this;
	},

	getLabel: function() {
		return this.label;
	},

	attachEvents: function() {
		this.addEvent('mouseup', this.bound('onMouseUp'))
		this.addEvent('mousedown', this.bound('onMouseDown'));
		this.parent();
		return this;
	},

	detachEvents: function() {
		this.removeEvent('mouseup', this.bound('onMouseUp'));
		this.removeEvent('mousedown', this.bound('onMouseDown'));
		this.parent();
		return this;
	},

	onMouseDown: function(e) {
		this.addClass(this.options.className + '-down');
		return this;
	},

	onMouseUp: function(e) {
		this.removeClass(this.options.className + '-down');
		return this;
	}

});

/*
---

name: ButtonGroupStyle

description: Provide constants for button group styles.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:

provides:
	- ButtonGroupStyle

...
*/

if (!window.Moobile) window.Moobile = {};

Moobile.ButtonGroupStyle = {

	Horizontal: {

		onAttach: function() {
			return this.addClass('style-horizontal');
		},

		onDetach: function() {
			return this.removeClass('style-horizontal');
		}

	},

	Vertical: {

		onAttach: function() {
			return this.addClass('style-vertical');
		},

		onDetach: function() {
			return this.removeClass('style-vertical');
		}

	}

};


/*
---

name: ButtonGroup

description:

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Control
	- ButtonGroupStyle

provides:
	- ButtonGroup

...
*/

Moobile.ButtonGroup = new Class({

	Extends: Moobile.Control,

	selectedButton: null,

	selectedButtonIndex: -1,

	options: {
		className: 'button-group',
		styleName: Moobile.ButtonGroupStyle.Horizontal
	},

	setSelectedButton: function(selectedButton) {

		if (this.selectedButton == selectedButton)
			return this;

		if (this.selectedButton) {
			this.selectedButton.setSelected(false);
			this.selectedButton = null;
			this.fireEvent('deselect', this.selectedButton);
		}

		if (selectedButton) {
			this.selectedButton = selectedButton;
			this.selectedButton.setSelected(true);
			this.fireEvent('select', this.selectedButton);
		}

		this.selectedButtonIndex = selectedButton ? this.childViews.indexOf(selectedButton) : -1;

		return this;
	},

	getSelectedButton: function() {
		return this.selectedButton;
	},

	setSelectedButtonIndex: function(index) {
		this.setSelectedButton(this.childViews[index]);
		return this;
	},

	getSelectedButtonIndex: function(index) {
		return this.selectedButtonIndex;
	},

	addButton: function(button, where, context) {
		return this.addChildView(button, where, context);
	},

	getButton: function(name) {
		return this.getChildView(name);
	},

	removeButton: function(button) {
		return this.removeChildView(button);
	},

	clearButtons: function() {
		return this.removeChildViews();
	},

	didAddChildView: function(childView) {
		this.parent(childView);
		childView.addEvent('click', this.bound('onButtonClick'));
		return this;
	},

	didRemoveChildView: function(childView) {
		this.parent(childView);
		childView.removeEvent('click', this.bound('onButtonClick'));
		return this;
	},

	onButtonClick: function(e) {
		this.setSelectedButton(e.target);
		return this;
	}

});

/*
---

name: BarStyle

description: Provide constants for bar styles.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:

provides:
	- BarStyle

...
*/

if (!window.Moobile) window.Moobile = {};

Moobile.BarStyle = {

	DefaultOpaque: {

		onAttach: function() {
			return this.addClass('style-default-opaque');
		},

		onDetach: function() {
			return this.removeClass('style-default-opaque');
		}

	},

	DefaultTranslucent: {

		onAttach: function() {
			return this.addClass('style-default-translucent');
		},

		onDetach: function() {
			return this.removeClass('style-default-translucent');
		}

	},

	BlackOpaque: {

		onAttach: function() {
			return this.addClass('style-black-opaque');
		},

		onDetach: function() {
			return this.removeClass('style-black-opaque');
		}

	},

	BlackTranslucent: {

		onAttach: function() {
			return this.addClass('style-black-translucent');
		},

		onDetach: function() {
			return this.removeClass('style-black-translucent');
		}

	}

};

/*
---

name: Bar

description: Provide the base class for a bar.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Control
	- BarStyle

provides:
	- Bar

...
*/

Moobile.Bar = new Class({

	Extends: Moobile.Control,

	options: {
		className: 'bar',
		styleName: Moobile.BarStyle.DefaultOpaque
	}

});

/*
---

name: BarTitle

description:

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Control

provides:
	- BarTitle

...
*/

Moobile.BarTitle = new Class({

	Extends: Moobile.Control,

	text: null,

	options: {
		className: 'bar-title'
	},

	build: function(element) {
		this.parent(element);
		this.set('role', 'bar-title');
		return this;
	},

	setText: function(text) {

		this.destroyChildViews();

		if (this.text) {
			this.text = '';
		}

		if (text) {
			this.text = text;
		}

		this.content.set('html', this.text);

		return this;
	},

	getText: function() {
		return this.text;
	}

});

/*
---

name: BarButtonStyle

description: Provide constants for bar button styles.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:

provides:
	- BarButtonStyle

...
*/

if (!window.Moobile) window.Moobile = {};

Moobile.BarButtonStyle = {

	Default: {

		onAttach: function() {
			return this.addClass('style-default');
		},

		onDetach: function() {
			return this.removeClass('style-default');
		}

	},

	Active: {

		onAttach: function() {
			return this.addClass('style-active');
		},

		onDetach: function() {
			return this.removeClass('style-active');
		}

	},

	Warning: {

		onAttach: function() {
			return this.addClass('style-warning');
		},

		onDetach: function() {
			return this.removeClass('style-warning');
		}

	},

	Back: {

		onAttach: function() {
			return this.addClass('style-back');
		},

		onDetach: function() {
			return this.removeClass('style-back');
		}

	},

	Forward: {

		onAttach: function() {
			return this.addClass('style-forward');
		},

		onDetach: function() {
			return this.removeClass('style-forward');
		}

	}

};

/*
---

name: BarButton

description: Provides a button used inside a bar such as the navigation bar.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Button
	- BarButtonStyle

provides:
	- BarButton

...
*/

Moobile.BarButton = new Class({

	Extends: Moobile.Button,

	options: {
		className: 'bar-button',
		styleName: Moobile.BarButtonStyle.Default
	},

	build: function(element) {
		this.parent(element);
		this.set('role', 'bar-button');
		return this;
	}

});

/*
---

name: NavigationBar

description: Provide the navigation bar control.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Bar

provides:
	- NavigationBar

...
*/

Moobile.NavigationBar = new Class({

	Extends: Moobile.Bar,

	title: null,

	leftBarButton: null,

	leftBarButtonVisible: true,

	rightBartButton: null,

	rightBarButtonVisible: true,

	build: function(element) {

		this.parent(element);

		var lBarButton = this.getElement('[data-role=bar-button][data-task=left]');
		var rBarButton = this.getElement('[data-role=bar-button][data-task=right]');

		var title = this.getElement('[data-role=bar-title]');
		if (title == null) {
			title = new Element('div[data-role=bar-title]');
			title.ingest(this.content);
			title.inject(this.content);
		}

		this.title = this.getRoleInstance(title);

		if (lBarButton) {
			lBarButton.inject(this.content, 'top');
			lBarButton = this.getRoleInstance(lBarButton);
			this.setLeftBarButton(lBarButton);
		}

		if (rBarButton) {
			rBarButton.inject(this.content);
			rBarButton = this.getRoleInstance(rBarButton);
			this.setRightBarButton(rBarButton);
		}

		if (this.options.className) {
			this.element.addClass('navigation-' + this.options.className);
		}

		return this;
	},

	setTitle: function(title) {

		if (this.title == title)
			return this;

		this.title.setText(null);
		this.title.hide();

		if (title) {

			var type = typeOf(title);
			if (type == 'string') {
				this.title.setText(title);
				this.title.show();
				return this;
			}

			if (type == 'element') {
				title = new Moobile.BarTitle(title);
			}

			this.replaceChildView(this.title, title);
			this.title.destroy();
			this.title = title;
		}

		return this;
	},

	getTitle: function() {
		return this.title;
	},

	setLeftBarButton: function(leftBarButton) {

		if (this.leftBarButton == leftBarButton)
			return this;

		if (this.leftBarButton) {
			this.leftBarButton.removeFromParentView();
			this.leftBarButton.destroy();
			this.leftBarButton = null;
		}

		if (leftBarButton) {

			var type = typeOf(leftBarButton);
			if (type == 'string') {
				this.leftBarButton = new Moobile.BarButton();
				this.leftBarButton.setLabel(leftBarButton);
			} else if (type == 'element') {
				this.leftBarButton = new Moobile.BarButton(leftBarButton);
			}

			this.leftBarButton = leftBarButton;
			this.leftBarButton.set('data-align', 'left');

			this.addChildView(this.leftBarButton, 'before', this.title);

			if (this.leftBarButtonVisible == false) {
				this.leftBarButton.hide();
			}
		}

		return this;
	},

	getLeftBarButton: function() {
		return this.leftBarButton;
	},

	setLeftBarButtonVisible: function(visible) {
		this.leftBarButtonVisible = visible;
		if (this.leftBarButton) {
			this.leftBarButton[visible ? 'show' : 'hide'].call(this.leftBarButton);
		}
		return this;
	},

	isLeftBarButtonVisible: function() {
		return this.leftBarButtonVisible;
	},

	setRightBarButton: function(rightBarButton) {

		if (this.rightBarButton == rightBarButton)
			return this;

		if (this.rightBarButton) {
			this.rightBarButton.removeFromParentView();
			this.rightBarButton.destroy();
			this.rightBarButton = null;
		}

		if (rightBarButton) {

			var type = typeOf(rightBarButton);
			if (type == 'string') {
				this.rightBarButton = new Moobile.BarButton();
				this.rightBarButton.setLabel(rightBarButton);
			} else if (type == 'element') {
				this.rightBarButton = new Moobile.BarButton(rightBarButton);
			}

			this.rightBarButton = rightBarButton;
			this.rightBarButton.set('data-align', 'right');

			this.addChildView(this.rightBarButton, 'before', this.title);

			if (this.rightBarButtonVisible == false) {
				this.rightBarButton.hide();
			}
		}

		return this;
	},

	getRightBarButton: function() {
		return this.rightBarButton;
	},

	setRightBarButtonVisible: function(visible) {
		this.rightBarButtonVisible = visible;
		if (this.rightBarButton) {
			this.rightBarButton[visible ? 'show' : 'hide'].call(this.rightBarButton);
		}
		return this;
	},

	isRightBarButtonVisible: function() {
		return this.rightBarButtonVisible;
	},

	release: function() {
		this.title = null;
		this.leftBarButton = null;
		this.rightBarButton = null;
		this.parent();
		return this;
	}

});

/*
---

name: Slider

description:

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- More/Class.Refactor
	- More/Slider
	- Control

provides:
	- Slider

...
*/

Class.refactor(Slider, {

	draggedKnob: function() {
		this.fireEvent('move', this.drag.value.now[this.axis]);
		this.previous();
	}

});

Moobile.Slider = new Class({

	Extends: Moobile.Control,

	value: 0,

	slider: null,

	track: null,

	thumb: null,

	options: {
		className: 'slider',
		snap: false,
		mode: 'horizontal',
		min: 0,
		max: 100,
		background: true,
		backgroundSize: 2048,
		value: 0
	},

	build: function(element) {

		this.parent(element);

		this.thumb = new Element('div.' + this.options.className + '-thumb');
		this.track = new Element('div.' + this.options.className + '-track');
		this.track.grab(this.thumb);

		this.content.empty();
		this.content.grab(this.track);

		return this;
	},

	setValue: function(value) {
		this.slider.set(this.value = value);
		return this;
	},

	getValue: function() {
		return this.value;
	},

	init: function() {
		this.parent();
		this.attachSlider();
		this.setValue(0);
		return this;
	},

	release: function() {
		this.detachSlider();
		this.thumb = null;
		this.parent();
		return this;
	},

	attachSlider: function() {

		var options = {
			snap: this.options.snap,
			steps: this.options.max - this.options.min,
			range: [this.options.min, this.options.max],
			mode: this.options.mode
		};

		this.slider = new Slider(this.track, this.thumb, options);
		this.slider.addEvent('move', this.bound('onMove'));
		this.slider.addEvent('tick', this.bound('onTick'));
		this.slider.addEvent('change', this.bound('onChange'));

		return this;
	},

	detachSlider: function() {
		this.slider = null;
		return this;
	},

	updateTrack: function(position) {
		this.track.setStyle('background-position',
			(-this.options.backgroundSize / 2) + (position + this.thumb.getSize().x / 2)
		);
		return this;
	},

	onMove: function(position) {
		this.updateTrack(position);
		this.fireEvent('move', position);
	},

	onTick: function(position) {
		this.updateTrack(position);
		this.fireEvent('tick', position);
	},

	onChange: function(step) {
		this.value = step;
		this.updateTrack(this.slider.toPosition(step));
		this.fireEvent('change', step);
	}

});

/*
---

name: ListStyle

description: Provide constants for list styles.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:

provides:
	- ListStyle

...
*/

if (!window.Moobile) window.Moobile = {};

Moobile.ListStyle = {

	Default: {

		onAttach: function() {
			return this.addClass('style-default');
		},

		onDetach: function() {
			return this.removeClass('style-default');
		}

	},

	Grouped: {

		onAttach: function() {
			return this.addClass('style-grouped');
		},

		onDetach: function() {
			return this.removeClass('style-grouped');
		}
		
	}

};


/*
---

name: List

description: Provide a list of items.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Control
	- ListStyle

provides:
	- List

...
*/

Moobile.List = new Class({

	Extends: Moobile.Control,

	selectedItem: null,

	selectedItemIndex: -1,

	options: {
		className: 'list',
		styleName: Moobile.ListStyle.Default
	},

	build: function(element) {

		this.parent(element);

		var content = this.getElement('ul');
		if (content == null) {
			content = new Element('ul');
			content.ingest(this.content);
			content.inject(this.content);
		}

		this.content = content;

		return this;
	},

	setSelectedItem: function(selectedItem) {

		if (selectedItem && selectedItem.isSelectable() == false)
			return this;

		if (this.selectedItem == selectedItem)
			return this;

		if (this.selectedItem) {
			this.selectedItem.setSelected(false);
			this.selectedItem = null;
			this.fireEvent('deselect', this.selectedItem);
		}

		if (selectedItem) {
			this.selectedItem = selectedItem;
			this.selectedItem.setSelected(true);
			this.fireEvent('select', this.selectedItem);
		}

		this.selectedItemIndex = selectedItem ? this.childViews.indexOf(selectedItem) : -1;

		return this;
	},

	setSelectedItemIndex: function(index) {
		this.setSelectedItem(this.childViews[index] || null);
		return this;
	},

	addItem: function(item, where, context) {
		return this.addChildView(item, where, context);
	},

	getItem: function(name) {
		return this.getChildView(name);
	},

	removeItem: function(item) {
		return this.removeChildView(item);
	},

	clearItems: function() {
		return this.removeChildViews();
	},

	didAddChildView: function(item) {

		this.parent(item);

		if (item instanceof Moobile.ListItem) {
			item.addEvent('click', this.bound('onItemClick'));
			item.addEvent('mouseup', this.bound('onItemMouseUp'));
			item.addEvent('mousedown', this.bound('onItemMouseDown'));
		}

		return this;
	},

	didRemoveChildView: function(item) {

		this.parent(item);

		if (item instanceof Moobile.ListItem) {
			item.removeEvent('click', this.bound('onItemClick'));
			item.removeEvent('mouseup', this.bound('onItemMouseUp'));
			item.removeEvent('mousedown', this.bound('onItemMouseDown'));
		}

		return this;
	},

	onItemClick: function(e) {
		var item = e.target;
		if (this.selectable) this.setSelectedItem(item);
		this.fireEvent('click', e);
		return this;
	},

	onItemMouseUp: function(e) {
		var item = e.target;
		if (this.selectable && this.highlightable) item.setHighlighted(false);
		this.fireEvent('mouseup', e);
		return this;
	},

	onItemMouseDown: function(e) {
		var item = e.target;
		if (this.selectable && this.highlightable) item.setHighlighted(true);
		this.fireEvent('mousedown', e);
		return this;
	}

});


/*
---

name: ListItemStyle

description: Provide constants for list item styles.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:

provides:
	- ListItemStyle

...
*/

if (!window.Moobile) window.Moobile = {};

Moobile.ListItemStyle = {

	Checked: {

		onAttach: function() {
			return this.addClass('style-checked');
		},

		onDetach: function() {
			return this.removeClass('style-checked');
		}

	},

	Disclosed: {

		onAttach: function() {
			return this.addClass('style-disclosed');
		},

		onDetach: function() {
			return this.removeClass('style-disclosed');
		}

	},

	Detailed: {

		onAttach: function() {
			return this.addClass('style-detailed');
		},

		onDetach: function() {
			return this.removeClass('style-detailed');
		}

	},

	Activity: {

		onAttach: function() {
			
			var activity = this.getElement('div.list-item-activity');
			if (activity == null) {
				activity = new Element('div.list-item-activity');
				activity.inject(this.element);
			}

			return this.addClass('style-activity');
		},

		onDetach: function() {
			
			var activity = this.getElement('div.list-item-activity');
			if (activity) {
				activity.destroy();
			}
			
			return this.removeClass('style-activity');
		}

	}

};

/*
---

name: ListItem

description: Provide an item of a list.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Control
	- ListItemStyle

provides:
	- ListItem

...
*/

Moobile.ListItem = new Class({

	Extends: Moobile.Control,

	label: null,

	image: null,

	accessory: null,

	options: {
		className: 'list-item'
	},

	found: function(element) {
		return document.id(element) || new Element('li');
	},

	build: function(element) {

		this.parent(element);

		this.set('role', 'list-item');

		var label = this.getElement('[data-role=label]:not([data-task])');
		var image = this.getElement('[data-role=image]:not([data-task])');

		var accessory = this.getElement('[data-role=label][data-task=accessory]');
		if (accessory == null) {
			accessory = new Element('div[data-role=label][data-task=accessory]');
		}
		
		if (label == null) {
			label = new Element('div[data-role=label]');
			label.ingest(this.content);
		}

		if (image == null) {
			image = new Element('div[data-role=image]');
		}

		image.inject(this.element, 'top');
		label.inject(this.content, 'top');
		accessory.inject(this.element);

		this.label = this.getRoleInstance(label);
		this.image = this.getRoleInstance(image);		
		this.accessory = this.getRoleInstance(accessory);
	
		return this;
	},

	setLabel: function(label) {

		if (this.label == image)
			return this;

		this.label.setText(null);
		this.label.hide();

		if (label) {

			var type = typeOf(label);
			if (type == 'string') {
				this.label.setText(label);
				this.label.show();
				return this;
			}

			if (type == 'element') {
				label = new Moobile.Label(label);
			}

			this.replaceChildView(this.label, label);
			this.label.destroy();
			this.label = label;
		}

		return this;
	},

	getLabel: function() {
		return this.label;
	},

	setImage: function(image) {

		if (this.image == image)
			return this;

		this.image.setText(null);
		this.image.hide();

		if (image) {

			var type = typeOf(label);
			if (type == 'string') {
				this.image.setText(label);
				this.image.show();
				return this;
			}

			if (type == 'element') {
				image = new Moobile.Label(image);
			}

			this.replaceChildView(this.image, image);

			this.image.destroy();
			this.image = image;
		}

		return this;
	},

	getImage: function() {
		return this.image;
	}

});

/*
---

name: ActivityIndicatorStyle

description: Provide constants for activity indicator styles.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:

provides:
	- ActivityIndicatorStyle

...
*/

if (!window.Moobile) window.Moobile = {};

Moobile.ActivityIndicatorStyle = {

	Default: {

		onAttach: function() {
			return this.addClass('style-default');
		},

		onDetach: function() {
			return this.removeClass('style-default');
		}

	},

	Box: {

		onAttach: function() {
			return this.addClass('style-box');
		},

		onDetach: function() {
			return this.removeClass('style-box');
		}
		
	}

};

/*
---

name: ActivityIndicator

description: Provide an activity indicator.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Control
	- ActivityIndicatorStyle

provides:
	- ActivityIndicator

...
*/

Moobile.ActivityIndicator = new Class({

	Extends: Moobile.Control,

	options: {
		className: 'activity-indicator',
		styleName: Moobile.ActivityIndicatorStyle.Default
	},

	build: function(element) {

		this.parent(element);

		this.start();

		return this;
	},

	start: function() {
		this.addClass('activity');
		return this;
	},

	pause: function() {
		this.removeClass('activity');
		return this;
	},

	center: function() {
		var wrapper = this.parentView || this.window;
		if (wrapper) {
			var wrapperSize = wrapper.content.getSize();
			var elementSize = this.element.getSize();
			var t = wrapperSize.y / 2 - elementSize.x / 2;
			var l = wrapperSize.x / 2 - elementSize.x / 2;
			this.setStyle('top', t);
			this.setStyle('left', l);
			this.setStyle('position', 'absolute');
		}
		return this;
	}

});

/*
---

name: Image

description: Provide an image view.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- View

provides:
	- Image

...
*/

Moobile.Image = new Class({

	Extends: Moobile.View,

	image: null,

	options: {
		className: 'image'
	},

	build: function(element) {

		this.parent(element);

		this.element.set('role', 'image');

		var image = this.getElement('img');
		if (image == null) {
			image = new Element('img')
			image.hide();
			image.inject(this.content);
		}

		this.image = image;

		return this;
	},

	setImage: function(image) {

		this.image.set('src', null);
		this.image.hide();

		if (source) {
			this.image.set('src', image);
			this.image.show();
		}

		return this;
	},

	getImage: function() {
		return this.image.get('src');
	}

});

/*
---

name: Label

description: Provide a label

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- View

provides:
	- Label

...
*/

Moobile.Label = new Class({

	Extends: Moobile.View,

	text: null,

	options: {
		className: 'label'
	},

	build: function(element) {

		this.parent(element);

		this.element.set('role', 'label');

		var text = this.getElement('[data-role=text]');
		if (text == null) {
			text = new Element('span[data-role=text]');
			text.ingest(this.content);
			text.inject(this.content);
		}

		this.text = text;

		return this;
	},

	setText: function(text) {

		this.text.set('html', null);
		this.text.hide();

		if (text) {
			this.text.set('html', text);
			this.text.show();
		}

		return this;
	},

	getText: function() {
		return this.text.get('html');
	}

});

/*
---

name: Mask

description: Creates a mask over the entire app.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- View

provides:
	- Mask

...
*/

Moobile.Mask = new Class({

	Extends: Moobile.View,

	options: {
		className: 'mask',
		fillStyle: 'solid'
	},

	build: function(element) {
		
		this.parent(element);
		
		if (this.options.className) {
			this.element.addClass(this.options.className + '-' + this.options.fillStyle);			
		}
		
		return this;
	},

	attachEvents: function() {
		this.element.addEvent('transitionend', this.bound('onTransitionEnd'));
		this.parent();
		return this;
	},

	detachEvents: function() {
		this.element.removeEvent('transitionend', this.bound('onTransitionEnd'));
		this.parent();
		return this;
	},

	show: function() {
		this.element.addClass.delay(5, this.element, 'visible');
		return this;
	},

	hide: function() {
		this.element.removeClass.delay(5, this.element, 'visible');
		return this;
	},

	onTransitionEnd: function(e) {
		var opacity = this.element.getStyle('opacity');
		if (opacity == 0) {
			this.didHide();
			this.fireEvent('hide');
		} else {
			this.didShow();
			this.fireEvent('show');
		}
		return this;
	}

});


/*
---

name: Alert

description: Provide an alert message box.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Control
	- AlertStyle

provides:
	- Alert

...
*/

Moobile.Alert = new Class({

	Extends: Moobile.View,

	options: {
		className: 'alert',
		buttonLabel: 'OK',
		buttonLayout: 'vertical'
	},

	mask: null,

	header: null,

	footer: null,

	buttons: [],

	build: function(element) {

		this.parent(element);

		this.set('role', 'dialog');

		this.header = new Element('div');
		this.header.inject(this.element, 'top');

		this.footer = new Element('div');
		this.footer.inject(this.element, 'bottom');

		if (this.options.className) {
			this.header.addClass(this.options.className + '-header');
			this.footer.addClass(this.options.className + '-footer');
			this.element.addClass(this.options.className + '-' + this.options.buttonLayout);
		}

		return this;
	},

	setTitle: function(title) {
		this.header.empty();
		this.header.set('html', title);
		return this;
	},

	setMessage: function(message) {
		this.content.empty();
		this.content.set('html', message);
		return this;
	},

	addButton: function(button) {
		button.addEvent('click', this.bound('onButtonClick'));
		this.addChildView(button, 'bottom', this.footer);
		this.buttons.push(button);
		return this;
	},

	present: function() {

		if (this.buttons.length == 0) {
			var dismissButton = new Moobile.Button();
			dismissButton.setLabel(this.options.buttonLabel);
			dismissButton.setHighlighted(true);
			this.addButton(dismissButton);
		}

		this.mask = new Moobile.Mask(null, {
			fillStyle: 'gradient'
		});

		Moobile.Window.getInstance().addChildView(this.mask);

		this.mask.addChildView(this);
		this.mask.show();

		this.element.addEvent('animationend:once', this.bound('onPresentAnimationComplete'));
		this.element.addClass('present');

		return this;
	},

	dismiss: function() {

		this.mask.hide();
		this.mask.addEvent('hide', this.bound('onMaskHide'));

		this.element.addEvent('animationend:once', this.bound('onDismissAnimationComplete'));
		this.element.addClass('dismiss');

		return this;
	},

	onPresentAnimationComplete: function() {
		this.fireEvent('present');
		return this;
	},

	onDismissAnimationComplete: function() {
		this.removeFromParentView();
		this.fireEvent('dismiss');
		return this;
	},

	onButtonClick: function(e) {

		this.fireEvent('buttonclick', e.target);

		if (this.buttons.length == 1) {
			this.dismiss();
		}

		return this;
	},

	onMaskHide: function() {
		this.removeFromParentView();
		this.mask.destroy();
		this.mask = null;
	}

});

/*
---

name: View.Roles

description: Provides the behavior of differents roles.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- View

provides:
	- View.Roles

...
*/

Moobile.View.Roles = {

	text: {
		stop: false
	},

	content: {
		stop: false,
		onAttach: function() {
			this.addClass('content');
		}
	},

	wrapper: {
		stop: false,
		onAttach: function() {
			this.addClass('wrapper');
		}
	},

	label: {
		stop: true,
		apply: function() {
			var n = this.get('name');
			var o = this.get('options');
			var c = this.get('data-label') || Moobile.Label;
			return Class.instanciate(c, this, o, n);
		}
	},

	image: {
		stop: true,
		apply: function() {
			var n = this.get('name');
			var o = this.get('options');
			var c = this.get('data-image') || Moobile.Image;
			return Class.instanciate(c, this, o, n);
		}
	},

	view: {
		stop: true,
		apply: function() {
			var n = this.get('name');
			var o = this.get('options');
			var c = this.get('data-view') || Moobile.View;
			return Class.instanciate(c, this, o, n);
		}
	},

	control: {
		stop: true,
		apply: function() {
			var n = this.get('name');
			var o = this.get('options');
			var c = this.get('data-control') || Moobile.Control;
			return Class.instanciate(c, this, o, n);
		}
	},

	'list-item': {
		stop: true,
		apply: function() {
			var n = this.get('name');
			var o = this.get('options');
			var c = this.get('data-list-item') || Moobile.ListItem;
			return Class.instanciate(c, this, o, n);
		}
	},

	'bar-title': {
		stop: true,
		apply: function() {
			var n = this.get('name');
			var o = this.get('options');
			var c = this.get('data-bar-title') || Moobile.BarTitle;
			return Class.instanciate(c, this, o, n);
		}
	},

	'bar-button': {
		stop: true,
		apply: function() {
			var n = this.get('name');
			var o = this.get('options');
			var c = this.get('data-bar-button') || Moobile.BarButton;
			return Class.instanciate(c, this, o, n);
		}
	}

};

/*
---

name: ScrollView

description: Provide a view that scrolls when the content is larger that the
             window.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- View

provides:
	- ScrollView

...
*/

(function() {

var instances = 0;

Moobile.ScrollView = new Class({

	Extends: Moobile.View,

	wrapper: null,

	scroller: null,

	defaultContentOffset: {
		x: 0,
		y: 0
	},

	getWrapper: function() {
		return this.wrapper;
	},

	getScroller: function() {
		return this.scroller;
	},

	getContentSize: function() {
		return this.content.getScrollSize();
	},

	getContentOffset: function() {
		return this.scroller.getOffset();
	},

	build: function(element) {

		this.parent(element);

		var wrapper = this.getElement('[data-role=wrapper]');
		if (wrapper == null) {
			wrapper = new Element('div[data-role=wrapper]');
			wrapper.wraps(this.content);
		}

		this.wrapper = wrapper;

		if (this.options.className) {
			this.element.addClass('scroll-' + this.options.className);
			this.wrapper.addClass('scroll-' + this.options.className + '-wrapper');
		}

		return this;
	},

	init: function() {
		this.parent();
		this.scroller = new Moobile.Scroller(this.wrapper, this.content);
		return this;
	},

	release: function() {
		this.scroller.destroy();
		this.scroller = null;
		this.wrapper = null;
		this.parent();
		return this;
	},

	attachEvents: function() {
		if (++instances == 1) document.addEventListener('touchmove', this.onDocumentTouchMove);
		this.scroller.addEvent('scrollstart', this.bound('onViewScrollStart'));
		this.scroller.addEvent('scrollmove', this.bound('onViewScrollMove'));
		this.scroller.addEvent('scrollend', this.bound('onViewScrollEnd'));
		this.scroller.addEvent('refresh', this.bound('onViewScrollRefresh'));
		this.parent();
		return this;
	},

	detachEvents: function() {
		if (--instances == 0) document.removeEventListener('touchmove', this.onDocumentTouchMove);
		this.scroller.removeEvent('scrollstart', this.bound('onViewScrollStart'));
		this.scroller.removeEvent('scrollmove', this.bound('onViewScrollMove'));
		this.scroller.removeEvent('scrollend', this.bound('onViewScrollEnd'));
		this.scroller.removeEvent('refresh', this.bound('onViewScrollRefresh'));
		this.parent();
		return this;
	},

	scrollTo: function(x, y, time, relative) {
		this.scroller.scrollTo(x, y, time, relative);
		return this;
	},

	scrollToElement: function(element, time) {
		this.scroller.scrollToElement(element, time);
		return this;
	},

	scrollToPage: function (pageX, pageY, time) {
		this.scroller.scrollToPage(pageX, pageY, time);
		return this;
	},

	didShow: function() {
		this.scroller.enable();
		this.scroller.scrollTo(this.defaultContentOffset.x, this.defaultContentOffset.y);
		this.parent();
		return this;
	},

	willHide: function() {
		this.defaultContentOffset = this.scroller.getOffset();
		this.scroller.disable();
		this.parent();
		return this;
	},

	onViewScrollRefresh: function() {
		this.fireEvent('scrollrefresh');
		return this;
	},

	onViewScrollStart: function() {
		this.fireEvent('scrollstart');
		return this;
	},

	onViewScrollMove: function() {
		this.fireEvent('scrollmove');
		return this;
	},

	onViewScrollEnd: function() {
		this.fireEvent('scrollend');
		return this;
	}

});

})();

/*
---

name: ViewPanel

description: The view that must be used in conjunction with a
             ViewControllerPanel.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- View

provides:
	- ViewPanel

...
*/

Moobile.ViewPanel = new Class({

	Extends: Moobile.View,

	sidePanel: null,

	mainPanel: null,

	build: function(element) {

		this.parent(element);

		var sidePanel = this.getElement('[data-role=side-panel]');
		if (sidePanel == null) {
			sidePanel = new Element('div[data-role=side-panel]');
			sidePanel.inject(this.content);
		}

		var mainPanel = this.getElement('[data-role=main-panel]');
		if (mainPanel == null) {
			mainPanel = new Element('div[data-role=main-panel]');
			mainPanel.inject(this.content);
		}

		this.sidePanel = sidePanel;
		this.mainPanel = mainPanel;

		var className = this.options.className;
		if (className) {
			this.element.addClass(className + '-panel');
			this.sidePanel.addClass(className + '-panel-side-panel');
			this.mainPanel.addClass(className + '-panel-main-panel');
		}

		return this;
	},

	getSidePanel: function() {
		return this.sidePanel;
	},

	getMainPanel: function() {
		return this.mainPanel;
	},

	filterOwnElement: function(element) {
		var parent = element.getParent('[data-role]:not([data-role=element])');
		if (parent == null) return true;
		return parent == this.element || parent == this.content || parent == this.sidePanel || parent == this.mainPanel;
	},

});

/*
---

name: ViewStack

description: The view that must be used in conjunction with a
             ViewControllerStack.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- View

provides:
	- ViewStack

...
*/

Moobile.ViewStack = new Class({

	Extends: Moobile.View,

	build: function(element) {

		this.parent(element);

		var className = this.options.className;
		if (className) {
			this.element.addClass(className + '-stack');
		}

		return this;
	}

});

/*
---

name: Scroller

description: Provides an iScroll wrapper

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Class
	- Core/Class.Extras
	- Class.Mutator.Property

provides:
	- Scroller

...
*/

(function() {

iScroll.prototype._currentSize = {x: 0, y: 0};

var _checkDOMChanges = iScroll.prototype._checkDOMChanges;

iScroll.prototype._checkDOMChanges = function() {

	_checkDOMChanges.call(this);

	var size = this.wrapper.getSize();
	if (this._currentSize.x != size.x || this._currentSize.y != size.y) {
		this._currentSize = size;
		this.refresh();
	}

};

})();

Moobile.Scroller = new Class({

	Implements: [
		Events,
		Options,
		Class.Binds
	],

	ready: null,

	content: null,

	wrapper: null,

	scroller: null,

	size: null,

	options: {
		useTransform: true,
		useTransition: true,		
		hideScrollbar: true,
		fadeScrollbar: true,
		checkDOMChanges: true,
		snap: false
	},

	initialize: function(wrapper, content, options) {

		this.setOptions(options);

		wrapper = document.id(wrapper);
		content = content || null;

		if (content == null) {
			content = new Element('div')
			content.ingest(wrapper);
			content.inject(wrapper);
		}

		this.content = content;
		this.wrapper = wrapper;

		this.scroller = new iScroll(this.wrapper, this.options);

		this.attachEvents();

		return this;
	},

	attachEvents: function() {
		this.options.onScrollStart = this.bound('onScrollStart');
		this.options.onScrollMove = this.bound('onScrollMove');
		this.options.onScrollEnd = this.bound('onScrollEnd');
		this.options.onRefresh = this.bound('onRefresh');
		return this;
	},

	detachEvents: function() {
		this.options.onScrollStart = null;
		this.options.onScrollMove = null;
		this.options.onScrollEnd = null;
		this.options.onRefresh = null;
		return this;
	},

	getOffset: function() {

		var x = 0;
		var y = 0;

		var position = this.content.getStyle('-webkit-transform');
		if (position) position = position.match(/translate3d\(-*(\d+)px, -*(\d+)px, -*(\d+)px\)/);
		if (position) {
			if (position[1]) x = -position[1];
			if (position[2]) y = -position[2];
		}

		return {x: x, y: y};
	},

	isReady: function() {
		return this.scroller.isReady();
	},

	scrollTo: function(x, y, time, relative) {
		(function() { this.scroller.scrollTo(x, y, time, relative); }).delay(5, this);
		return this;
	},

	scrollToElement: function(element, time) {
		(function() { this.scroller.scrollToElement(element, time); }).delay(5, this);
		return this;
	},

	scrollToPage: function (pageX, pageY, time) {
		(function() { this.scroller.scrollToPage(pageX, pageY, time); }).delay(5, this);
		return this;
	},

	refresh: function() {
		this.scroller.refresh();
		return this;
	},

	disable: function () {
		this.scroller.disable();
		return this;
	},

	enable: function () {
		this.scroller.enable();
		this.scroller.refresh();
		return this;
	},

	stop: function() {
		this.scroller.stop();
		return this;
	},

	destroy: function() {
		this.scroller.destroy();
		return this;
	},

	onRefresh: function() {
		this.fireEvent('refresh');
		return this;
	},

	onScrollStart: function() {
		this.fireEvent('scrollstart');
		return this;
	},

	onScrollMove: function() {
		this.fireEvent('scrollmove');
		return this;
	},

	onScrollEnd: function() {
		this.fireEvent('scrollend');
		return this;
	}

});

/*
---

name: Scroller.Carousel

description: Creates snap to element carousel.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Scroller

provides:
	- Scroller.Carousel

...
*/

Moobile.Scroller.Carousel = new Class({

	Extends: Moobile.Scroller,

	elements: [],

	options: {
		layout: 'horizontal',
		momentum: false,
		hScrollbar: false,
		vScrollbar: false,
		snap: true,
		snapThreshold: 40
	},

	initialize: function(wrapper, content, options) {

		this.parent(wrapper, content, options);

		this.wrapper.addClass('carousel');
		this.wrapper.addClass('carousel-' + this.options.layout);

		this.elements = this.content.getElements('>');
		this.elements.addClass('slide');

		this.update();

		return this;
	},

	update: function() {

		var size = null;
		var style = null;

		switch (this.options.layout) {
			case 'horizontal':
				size = this.wrapper.getSize().x;
				style = 'width';
				break;
			case 'vertical':
				size = this.wrapper.getSize().y;
				style = 'height';
				break;
		}

		this.elements.setStyle(style, 100 / this.elements.length + '%');
		this.content.setStyle(style, 100 * this.elements.length + '%');

		this.scroller.options.snapThreshold = size * this.options.snapThreshold / 100;

		return this;
	},

	onRefresh: function() {
		this.parent();
		this.update();
		return this;
	}

});

/*
---

name: ViewTransition

description: Provides the base class for view transition effects.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Class
	- Core/Class.Extras
	- Core/Element
	- Core/Element.Event
	- Core/Element.Style
	- Class-Extras/Class.Binds
	- Event.CSS3

provides:
	- ViewTransition

...
*/

if (!window.Moobile) window.Moobile = {};

Moobile.ViewTransition = new Class({

	Implements: [
		Events,
		Options,
		Chain,
		Class.Binds
	],

	subjects: [],

	options: {},

	initialize: function(options) {
		this.setOptions(options);
		return this;
	},

	animate: function(subject, className) {
		this.addSubject(subject, className);
		this.fireEvent('start');
		return this;
	},

	addSubject: function(subject, className) {

		var element = document.id(subject);
		if (element == null)
			return this;

		element.store('view-transition:transition-class', className);
		element.addClass(className);
		element.addEvent('transitionend', this.bound('onComplete'));
		element.addEvent('animationend', this.bound('onComplete'));
		this.subjects.push(element);

		return this;
	},

	removeSubject: function(subject) {

		var element = document.id(subject);
		if (element == null)
			return this;

		var className = element.retrieve('view-transition:transition-class');
		element.removeClass(className);
		element.removeEvent('transitionend', this.bound('onComplete'));
		element.removeEvent('animationend', this.bound('onComplete'));
		this.subjects.erase(element);

		return this;
	},

	clearSubjects: function() {
		this.subjects.each(this.bound('clearSubject'));
		this.subjects = [];
		return this;
	},

	clearSubject: function(subject) {
		var className = subject.retrieve('view-transition:transition-class');
		subject.removeClass(className);
		subject.removeEvent('transitionend', this.bound('onComplete'));
		subject.removeEvent('animationend', this.bound('onComplete'));
		return this;
	},

	enter: function(viewToShow, viewToHide, parentView, first) {
		if (viewToShow) viewToShow.show();
		this.addEvent('stop:once', this.didEnter.pass([viewToShow, viewToHide, parentView, first], this));
		return this;
	},

	leave: function(viewToShow, viewToHide, parentView) {
		if (viewToShow) viewToShow.show();
		this.addEvent('stop:once', this.didLeave.pass([viewToShow, viewToHide, parentView], this));
		return this;
	},

	didEnter: function(viewToShow, viewToHide, parentView, first) {
		if (viewToHide) viewToHide.hide();
		return this;
	},

	didLeave: function(viewToShow, viewToHide, parentView) {
		if (viewToHide) viewToHide.hide();
		return this;
	},

	onComplete: function(e) {
		if (this.subjects.contains(e.target)) {
			this.clearSubjects();
			this.fireEvent('stop');
			this.fireEvent('complete');
		}
		return this;
	}

});

/*
---

name: ViewTransition.Slide

description: Provide a slide view transition effect.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewTransition

provides:
	- ViewTransition.Slide

...
*/

Moobile.ViewTransition.Slide = new Class({

	Extends: Moobile.ViewTransition,

	enter: function(viewToShow, viewToHide, parentView, first) {

		this.parent(viewToShow, viewToHide, parentView, first);

		if (first) {
			this.animate(viewToShow, 'transition-slide-enter-first');
			return this;
		}

		this.addSubject(viewToShow, 'transition-view-to-show');
		this.addSubject(viewToHide, 'transition-view-to-hide');

		this.animate(parentView.content, 'transition-slide-enter');

		return this;
	},

	leave: function(viewToShow, viewToHide, parentView) {

		this.parent(viewToShow, viewToHide, parentView);

		this.addSubject(viewToShow, 'transition-view-to-show');
		this.addSubject(viewToHide, 'transition-view-to-hide');

		this.animate(parentView.content, 'transition-slide-leave');

		return this;
	}

});

/*
---

name: ViewTransition.Cover

description: Provide a view transition that covers the previous view.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewTransition

provides:
	- ViewTransition.Cover

...
*/

Moobile.ViewTransition.Cover = new Class({

	Extends: Moobile.ViewTransition,

	options: {
		presentation: 'fullscreen' // center, box
	},

	mask: null,

	enter: function(viewToShow, viewToHide, parentView, first) {

		this.parent(viewToShow, viewToHide, parentView, first);

		switch (this.options.presentation) {
			
			case 'box':					
				this.mask = new Moobile.Mask();
				viewToShow = new Element('div.transition-cover-view-wrapper').wraps(viewToShow);
				parentView.addClass('transition-cover-box');				
				break;
			
			case 'center':
				this.mask = new Moobile.Mask();
				parentView.addClass('transition-cover-center');		
				break;
			
			case 'fullscreen':
				this.mask = null;
				break;
		}
		
		if (this.mask) {

			this.mask.addClass('transition-cover-mask');
			this.mask.addEvent('show', this.bound('onMaskShow'));
			this.mask.addEvent('hide', this.bound('onMaskHide'));
			
			parentView.addChildView(this.mask)
			
			this.mask.show();			
		}

		if (first) {			
			this.animate(viewToShow, 'transition-cover-enter-first');
			return this;
		}

		viewToHide.addClass('transition-cover-background-view');
		viewToShow.addClass('transition-cover-foreground-view');

		this.addSubject(viewToShow, 'transition-view-to-show');
		this.addSubject(viewToHide, 'transition-view-to-hide');

		this.animate(parentView.getContent(), 'transition-cover-enter');

		return this;
	},

	didEnter: function(viewToShow, viewToHide, parentView, first) {
		
		this.parent(viewToShow, viewToHide, parentView, first);
		
		viewToHide.show();
		
		return this;
	},

	leave: function(viewToShow, viewToHide, parentView) {

		this.parent(viewToShow, viewToHide, parentView);
		
		if (this.mask) {
			this.mask.hide();
		}
		
		if (this.options.presentation == 'box') {
			var viewToHideElement = document.id(viewToHide);
			var viewToHideWrapper = viewToHideElement.getParent('.transition-cover-view-wrapper');
			if (viewToHideWrapper) {
				viewToHide = viewToHideWrapper;
			}				
		}
		
		this.addSubject(viewToShow, 'transition-view-to-show');
		this.addSubject(viewToHide, 'transition-view-to-hide');

		this.animate(parentView.getContent(), 'transition-cover-leave');

		return this;
	},
	
	didLeave: function(viewToShow, viewToHide, parentView) {

		this.parent(viewToShow, viewToHide, parentView);
		
		switch (this.options.presentation) {
			
			case 'box':	
								
				var viewToHideElement = document.id(viewToHide);
				var viewToHideWrapper = viewToHideElement.getParent('.transition-cover-view-wrapper');
				if (viewToHideWrapper) {
					viewToHideElement.inject(viewToHideWrapper, 'after');
					viewToHideWrapper.destroy();
					viewToHideWrapper = null;
				}
					
				parentView.removeClass('transition-cover-box');
				
				break;
			
			case 'center':
				parentView.removeClass('transition-cover-center');		
				break;
			
			case 'fullscreen':
				break;
		}	
		
		viewToHide.removeClass('transition-cover-foreground-view');
		viewToShow.removeClass('transition-cover-background-view');		
		
		return this;		
	},
	
	onMaskShow: function() {
		
	},
	
	onMaskHide: function() {
		this.mask.destroy();
		this.mask = null;
	}

});

/*
---

name: ViewTransition.Cubic

description: Provide a cubic view transition effect.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewTransition

provides:
	- ViewTransition.Cubic

...
*/

Moobile.ViewTransition.Cubic = new Class({

	Extends: Moobile.ViewTransition,

	enter: function(viewToShow, viewToHide, parentView, first) {

		this.parent(viewToShow, viewToHide, parentView, first);

		this.addSubject(parentView, 'transition-cubic-perspective');
		this.addSubject(viewToShow, 'transition-view-to-show');

		if (first) {
			this.animate(parentView.content, 'transition-cubic-enter-first');
			return this;
		}

		this.addSubject(viewToHide, 'transition-view-to-hide');

		this.animate(parentView.content, 'transition-cubic-enter');

		return this;
	},

	leave: function(viewToShow, viewToHide, parentView) {

		this.parent(viewToShow, viewToHide, parentView);

		this.addSubject(parentView, 'transition-cubic-perspective');

		this.addSubject(viewToShow, 'transition-view-to-show');
		this.addSubject(viewToHide, 'transition-view-to-hide');

		this.animate(parentView.content, 'transition-cubic-leave');

		return this;
	}

});


/*
---

name: ViewTransition.Fade

description: Provide a fade-in fade-out view transition effect.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewTransition

provides:
	- ViewTransition.Fade

...
*/

Moobile.ViewTransition.Fade = new Class({

	Extends: Moobile.ViewTransition,

	enter: function(viewToShow, viewToHide, parentView, first) {

		this.parent(viewToShow, viewToHide, parentView, first);

		if (first) {
			this.animate(parentView.content, 'transition-fade-enter-first');
			return this;
		}

		this.addSubject(viewToShow, 'transition-view-to-show');
		this.addSubject(viewToHide, 'transition-view-to-hide');

		this.animate(parentView.content, 'transition-fade-enter');

		return this;
	},

	leave: function(viewToShow, viewToHide, parentView) {

		this.parent(viewToShow, viewToHide, parentView);

		this.addSubject(viewToHide, 'transition-view-to-hide');
		this.addSubject(viewToShow, 'transition-view-to-show');

		this.animate(parentView.content, 'transition-fade-leave');

		return this;
	}

});



/*
---

name: ViewTransition.Flip

description: Provide a flip view transition effect.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewTransition

provides:
	- ViewTransition.Flip

...
*/

Moobile.ViewTransition.Flip = new Class({

	Extends: Moobile.ViewTransition,

	enter: function(viewToShow, viewToHide, parentView, first) {

		this.parent(viewToShow, viewToHide, parentView, first);

		this.addSubject(parentView, 'transition-flip-perspective');
		this.addSubject(viewToShow, 'transition-view-to-show');

		if (first) {
			this.animate(parentView.content, 'transition-flip-enter-first');
			return this;
		}

		this.addSubject(viewToHide, 'transition-view-to-hide');

		this.animate(parentView.content, 'transition-flip-enter');

		return this;
	},

	leave: function(viewToShow, viewToHide, parentView) {

		this.parent(viewToShow, viewToHide, parentView);

		this.addSubject(parentView, 'transition-flip-perspective');

		this.addSubject(viewToHide, 'transition-view-to-hide');
		this.addSubject(viewToShow, 'transition-view-to-show');

		this.animate(parentView.content, 'transition-flip-leave');

		return this;
	}

});



/*
---

name: ViewTransition.None

description: Provide a none animated transition

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewTransition

provides:
	- ViewTransition.None

...
*/

Moobile.ViewTransition.None = new Class({

	Extends: Moobile.ViewTransition,

	enter: function(viewToShow, viewToHide, parentView, first) {
		this.parent(viewToShow, viewToHide, parentView, first);
		this.fireEvent('stop');
		this.fireEvent('complete');
		return this;
	},

	leave: function(viewToShow, viewToHide, parentView) {
		this.parent(viewToShow, viewToHide, parentView);
		this.fireEvent('stop');
		this.fireEvent('complete');
		return this;
	}

});


/*
---

name: ViewController

description: Provides a way to handle the different states and events of a view.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Class
	- Core/Class.Extras
	- Core/Event
	- Core/Element
	- Core/Element.Event
	- Class-Extras/Class.Binds
	- Class.Instanciate
	- Class.Mutator.Property
	- Event.Loaded

provides:
	- ViewController

...
*/

if (!window.Moobile) window.Moobile = {};

Moobile.ViewController = new Class({

	Implements: [
		Events,
		Options,
		Class.Binds
	],

	window: null,

	name: null,

	title: null,

	ready: false,

	modal: false,

	view: null,

	viewLoaded: false,

	viewTransition: null,

	viewControllerStack: null,

	viewControllerPanel: null,

	parentViewController: null,

	modalViewController: null,

	childViewControllers: [],

	_viewRequest: null,

	initialize: function(source, options, name) {

		this.setOptions(options);

		this.name = name || null;

		var element = document.id(source);
		if (element) {
			this.loadViewWith(element);
			return this;
		}

		if (source) {
			this.loadViewFrom(source);
			return this;
		}

		this.loadViewWith(new Element('div'));

		return this;
	},

	getName: function() {
		return this.name;
	},

	setTitle: function(title) {
		this.title = title;
		return this;
	},

	getTitle: function() {
		return this.title == null ? 'Untitled' : this.title;
	},

	isReady: function() {
		return this.ready;
	},

	isModal: function() {
		return this.modal;
	},

	isViewLoaded: function() {
		return this.viewLoaded;
	},

	getView: function() {
		return this.view;
	},

	setViewTransition: function(viewTransition) {
		this.viewTransition = viewTransition;
		return this;
	},

	getViewTransition: function() {
		return this.viewTransition;
	},

	setViewControllerStack: function(viewControllerStack) {
		this.viewControllerStack = viewControllerStack;
		return this;
	},

	getViewControllerStack: function() {
		return this.viewControllerStack;
	},

	setViewControllerPanel: function(viewControllerPanel) {
		this.viewControllerPanel = viewControllerPanel;
		return this
	},

	getViewControllerPanel: function(viewControllerPanel) {
		return this.viewControllerPanel;
	},

	setParentViewController: function(parentViewController) {
		this.parentViewController = parentViewController;
		return this;
	},

	loadView: function(viewElement) {
		this.view = Class.instanciate(
			viewElement.get('data-view') || 'Moobile.View',
			viewElement
		);
		return this;
	},

	loadViewWith: function(element) {
		this.loadView(element);
		this.viewDidLoad();
		this.viewLoaded = true;
		this.fireEvent('viewload');
		return this;
	},

	loadViewFrom: function(source) {
		if (this._viewRequest == null) {
			this._viewRequest = new Moobile.Request.View()
		}
		this._viewRequest.cancel();
		this._viewRequest.load(source, this.bound('loadViewWith'));
		return this;
	},

	attachEvents: function() {
  		return this;
	},

	detachEvents: function() {
		return this;
	},

	startup: function() {

		if (this.ready == true)
			return this;

		this.ready = true;

		this.window = this.view.getWindow();

		this.attachChildViewControllers();
		this.init();
		this.attachEvents();

		return this;
	},

	destroy: function() {

		if (this.ready == false)
			return this;

		this.ready = false;

		this.detachEvents();
		this.release();
		this.destroyChildViewControllers();

		this.view.destroy();
		this.view = null;
		this.window = null;

		this.viewTransition = null;
		this.viewControllerStack = null;
		this.viewControllerPanel = null;
		this.parentViewController = null;

		return this;
	},

	init: function() {
		return this;
	},

	release: function() {
		return this;
	},

	presentModalViewController: function(viewController, viewTransition) {

		if (this.modalViewController)
			return this;

		this.window.disableInput();

		if (viewController.isViewLoaded() == false) {
			viewController.addEvent('viewload:once', function() {
				this.presentModalViewController(viewController, viewTransition);
			}.bind(this));
			return this;
		}
		
		this.modalViewController = viewController;
		this.modalViewController.modal = true;
		
		this.willPresentModalViewController();
		
		this.addChildViewController(this.modalViewController, 'bottom', this.window.getContent());

		var viewToShow = this.modalViewController.getView();
		var viewToHide = this.window.getRootView();

		viewTransition = viewTransition || new Moobile.ViewTransition.Cover;
		viewTransition.addEvent('start:once', this.bound('onPresentTransitionStart'));
		viewTransition.addEvent('complete:once', this.bound('onPresentTransitionCompleted'));
		viewTransition.enter(
			viewToShow,
			viewToHide,
			this.window
		);

		this.modalViewController.setViewTransition(viewTransition);

		return this;
	},

	onPresentTransitionStart: function() {
		this.modalViewController.viewWillEnter();
		return this;
	},

	onPresentTransitionCompleted: function() {
		this.modalViewController.viewDidEnter();
		this.didPresentModalViewController()
		this.window.enableInput();
		return this;
	},

	dismissModalViewController: function() {

		if (this.modalViewController == null)
			return this;

		this.window.disableInput();

		this.willDismissModalViewController()

		var viewToShow = this.window.getRootView();
		var viewToHide = this.modalViewController.getView();

		var viewTransition = this.modalViewController.viewTransition;
		viewTransition.addEvent('start:once', this.bound('onDismissTransitionStart'));
		viewTransition.addEvent('complete:once', this.bound('onDismissTransitionCompleted'));
		viewTransition.leave(
			viewToShow,
			viewToHide,
			this.window
		);

		return this;
	},

	onDismissTransitionStart: function() {
		this.modalViewController.viewWillLeave();
	},

	onDismissTransitionCompleted: function() {
		this.modalViewController.viewDidLeave();
		this.removeChildViewController(this.modalViewController);
		this.modalViewController.destroy();
		this.modalViewController = null;
		this.didDismissModalViewController();
		this.window.enableInput();	
		return this;
	},

	attachChildViewControllers: function() {
		var filter = this.bound('filterChildViewController');
		var attach = this.bound('attachChildViewController');
		this.view.getElements('[data-role=view-controller]').filter(filter).each(attach);
		return this;
	},

	attachChildViewController: function(element) {

		var viewControllerClass = element.get('data-view-controller');
		if (viewControllerClass) {

			var viewElement = element.getElement('[data-role=view]');
			if (viewElement == null) {
				throw new Error('You must define a view element under view-controller element');
			}

			var options = element.get('data-options');
			if (options) options = options.toJSONObject();

			var viewController = Class.instanciate(viewControllerClass, viewElement, options, element.get('data-name'));

			this.addChildViewController(viewController);

			element.grab(viewElement, 'before').destroy();
		}

		return this;
	},

	filterChildViewController: function(element) {
		return element.getParent('[data-role=view-controller]') == this.view.element; // not quite sure
	},

	destroyChildViewControllers: function() {
		this.childViewControllers.each(this.bound('destroyChildViewController'));
		this.childViewControllers.empty();
		return this;
	},

	destroyChildViewController: function(viewController) {
		viewController.destroy();
		viewController = null;
		return this;
	},

	addChildViewController: function(viewController, where, context) {

		if (viewController.isViewLoaded() == false) {
			viewController.addEvent('viewload:once', function() {
				this.addChildViewController(viewController, where, context);
			}.bind(this));
			return this;
		}

		var view = viewController.getView();

		if (viewController.isModal() == false) {
			viewController.setViewControllerStack(this.viewControllerStack);
			viewController.setViewControllerPanel(this.viewControllerPanel);
		}

		this.willAddChildViewController(viewController);
		this.childViewControllers.push(viewController);
		this.view.addChildView(view, where, context);
		viewController.setParentViewController(this);
		viewController.startup();
		this.didAddChildViewController(viewController);

		Object.defineMember(this, viewController, viewController.getName());

		return this;
	},

	getChildViewController: function(name) {
		return this.childViewControllers.find(function(viewController) {
			return viewController.getName() == name;
		});
	},

	getChildViewControllers: function() {
		return this.childViewControllers;
	},

	removeChildViewController: function(viewController) {

		var exists = this.childViewControllers.contains(viewController);
		if (exists == false)
			return this;

		var view = viewController.getView();

		this.willRemoveChildViewController(viewController);
		this.childViewControllers.erase(viewController);
		viewController.setViewControllerStack(null);
		viewController.setViewControllerPanel(null);
		viewController.setParentViewController(null);
		view.removeFromParentView();
		this.didRemoveChildViewController(viewController);

		return this;
	},

	removeFromParentViewController: function() {
		if (this.parentViewController) {
			this.parentViewController.removeChildViewController(this);
		}
		return this;
	},

	willAddChildViewController: function(viewController) {
		return this;
	},

	didAddChildViewController: function(viewController) {
		return this;
	},

	willRemoveChildViewController: function(viewController) {
		return this;
	},

	didRemoveChildViewController: function(viewController) {
		return this;
	},

	willPresentModalViewController: function() {
		return this;
	},
	
	didPresentModalViewController: function() {
		return this;
	},
	
	willDismissModalViewController: function() {
		return this;
	},
	
	didDismissModalViewController: function() {
		return this;
	},

	viewDidLoad: function() {
		return this;
	},

	viewWillEnter: function() {
		return this;
	},

	viewDidEnter: function() {
		return this;
	},

	viewWillLeave: function() {
		return this;
	},

	viewDidLeave: function() {
		return this;
	}

});

/*
---

name: ViewControllerStack

description: Provides a way to navigate from view to view and comming back.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewController

provides:
	- ViewControllerStack

...
*/

Moobile.ViewControllerStack = new Class({

	Extends: Moobile.ViewController,

	topViewController: null,

	getTopViewController: function() {
		return this.topViewController;
	},

	loadView: function(viewElement) {
		this.view = Class.instanciate(
			viewElement.get('data-view') || 'Moobile.ViewStack',
			viewElement
		);
		return this;
	},

	pushViewController: function(viewController, viewTransition) {

		if (this.topViewController == viewController)
			return;

		if (this.childViewControllers.length > 0)
			this.window.disableInput();

		if (viewController.isViewLoaded() == false) {
			viewController.addEvent('viewload:once', function() {
				this.pushViewController(viewController, viewTransition);
			}.bind(this));
			return this;
		}

		var viewControllerPushed = viewController; // ease of understanding

		var viewControllerExists = this.childViewControllers.contains(viewControllerPushed);
		if (viewControllerExists) {
			this.removeChildViewController(viewControllerPushed);
		}

		this.willPushViewController(viewControllerPushed);

		this.addChildViewController(viewControllerPushed);

		this.topViewController = viewControllerPushed;

		var viewControllerBefore = this.childViewControllers.lastItemAt(1);

		var viewToShow = viewControllerPushed.view;
		var viewToHide = viewControllerBefore
					   ? viewControllerBefore.view
					   : null;

		viewTransition = viewTransition || new Moobile.ViewTransition.None();
		viewTransition.addEvent('start:once', this.bound('onPushTransitionStart'));
		viewTransition.addEvent('complete:once', this.bound('onPushTransitionComplete'));
		viewTransition.enter(
			viewToShow,
			viewToHide,
			this.view,
			this.childViewControllers.length == 1
		);

		viewControllerPushed.setViewTransition(viewTransition);

		return this;
	},

	onPushTransitionStart: function() {

		var viewControllerPushed = this.childViewControllers.lastItemAt(0);
		var viewControllerBefore = this.childViewControllers.lastItemAt(1);
		if (viewControllerBefore) {
			viewControllerBefore.viewWillLeave();
		}

		viewControllerPushed.viewWillEnter();

		return this;
	},

	onPushTransitionComplete: function() {

		var viewControllerPushed = this.childViewControllers.lastItemAt(0);
		var viewControllerBefore = this.childViewControllers.lastItemAt(1);
		if (viewControllerBefore) {
			viewControllerBefore.viewDidLeave();
		}

		this.didPushViewController(viewControllerPushed);

		this.window.enableInput();

		viewControllerPushed.viewDidEnter();

		return this;
	},

	popViewControllerUntil: function(viewController) {

		if (this.childViewControllers.length <= 1)
			return this;

		var viewControllerIndex = this.childViewControllers.indexOf(viewController);
		if (viewControllerIndex > -1) {
			for (var i = this.childViewControllers.length - 2; i > viewControllerIndex; i--) {

				var viewControllerToRemove = this.childViewControllers[i];
				viewControllerToRemove.viewWillLeave();
				viewControllerToRemove.viewDidLeave();
				this.removeChildViewController(viewControllerToRemove);

				viewControllerToRemove.destroy();
				viewControllerToRemove = null;
			}
		}

		this.popViewController();

		return this;
	},

	popViewController: function() {

		if (this.childViewControllers.length <= 1)
			return this;

		this.window.disableInput();

		var viewControllerPopped = this.childViewControllers.lastItemAt(0);
		var viewControllerBefore = this.childViewControllers.lastItemAt(1);

		this.willPopViewController(viewControllerPopped);

		this.topViewController = viewControllerBefore;

		var viewTransition = viewControllerPopped.viewTransition;
		viewTransition.addEvent('start:once', this.bound('onPopTransitionStart'));
		viewTransition.addEvent('complete:once', this.bound('onPopTransitionComplete'));
		viewTransition.leave(
			viewControllerBefore.view,
			viewControllerPopped.view,
			this.view
		);

		return this;
	},

	onPopTransitionStart: function() {

		var viewControllerBefore = this.childViewControllers.lastItemAt(1);
		var viewControllerPopped = this.childViewControllers.lastItemAt(0);

		viewControllerBefore.viewWillEnter();
		viewControllerPopped.viewWillLeave();

		return this;
	},

	onPopTransitionComplete: function() {

		var viewControllerPopped = this.childViewControllers.lastItemAt(0);
		var viewControllerBefore = this.childViewControllers.lastItemAt(1);
		viewControllerBefore.viewDidEnter();
		viewControllerPopped.viewDidLeave();

		this.removeChildViewController(viewControllerPopped);

		this.didPopViewController(viewControllerPopped);

		viewControllerPopped.destroy();
		viewControllerPopped = null;

		this.window.enableInput();

		return this;
	},

	willAddChildViewController: function(viewController) {
		this.parent();
		viewController.setViewControllerStack(this);
		return this;
	},

	willPushViewController: function(viewController) {
		return this;
	},

	didPushViewController: function(viewController) {
		return this;
	},

	willPopViewController: function(viewController) {
		return this;
	},

	didPopViewController: function(viewController) {
		return this;
	}

});

/*
---

name: ViewControllerStack.Navigation

description: Provide navigation function to the view controller stack such as
             a navigation bar and navigation bar buttons.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewControllerStack

provides:
	- ViewControllerStack.Navigation

...
*/

Moobile.ViewControllerStack.Navigation = new Class({

	Extends: Moobile.ViewControllerStack,

	options: {
		backButton: true,
		backButtonLabel: 'Back'
	},

	willAddChildViewController: function(viewController) {

		this.parent(viewController);

		var view = viewController.getView();

		var navigationBar = view.getChildView('navigation-bar');
		if (navigationBar == null) {
			navigationBar = new Moobile.NavigationBar(null, null, 'navigation-bar');
			view.addChildView(navigationBar, 'header');
		}

		if (viewController.isModal() || this.childViewControllers.length == 0)
			return this;

		if (this.options.backButton) {

			var backButtonLabel = this.topViewController.getTitle() || this.options.backButtonLabel;
			if (backButtonLabel) {

				var backButton = new Moobile.BarButton();
				backButton.setStyle(Moobile.BarButtonStyle.Back);
				backButton.setLabel(backButtonLabel);
				backButton.addEvent('click', this.bound('onBackButtonClick'));

				navigationBar.setLeftBarButton(backButton);
			}
		}

		return this;
	},

	didAddChildViewController: function(viewController) {

		this.parent(viewController);

		var navigationBar = viewController.getView().getChildView('navigation-bar');
		if (navigationBar == null)
			return this;

		var title = viewController.getTitle();
		if (title) {
			navigationBar.setTitle(title)
		}

		return this;
	},

	onBackButtonClick: function() {
		this.popViewController();
	}

});

/*
---

name: ViewControllerPanel

description: Provide a way to have side by side view controllers.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewControllerCollection

provides:
	- ViewControllerPanel

...
*/

Moobile.ViewControllerPanel = new Class({

	Extends: Moobile.ViewController,

	mainViewController: null,

	sideViewController: null,

	setMainViewController: function(mainViewController) {

		if (this.mainViewController) {
			this.mainViewController.removeFromParentViewController();
			this.mainViewController.destroy();
			this.mainViewController = null;
		}

		this.mainViewController = mainViewController;

		this.addChildViewController(this.mainViewController, 'top', this.view.getMainPanel());

		return this;
	},

	getMainViewController: function() {
		return this.mainViewController;
	},

	setSideViewController: function(sideViewController) {

		if (this.sideViewController) {
			this.sideViewController.destroy();
			this.sideViewController = null;
		}

		this.sideViewController = sideViewController;

		this.addChildViewController(this.sideViewController, 'top', this.view.getSidePanel());

		return this;
	},

	getSideViewController: function() {
		return this.sideViewController;
	},

	loadView: function(viewElement) {
		this.view = Class.instanciate(
			viewElement.get('data-view') || 'Moobile.ViewPanel',
			viewElement
		);
		return this;
	},

	didAddChildViewController: function(viewController) {
		viewController.setViewControllerPanel(this);
		this.parent();
		return this;
	}

});

/*
---

name: Window

description: Provides the area where the views will be stored and displayed.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- View

provides:
	- Window

...
*/

if (!window.$moobile) window.$moobile = {};

(function() {

var instance = null;

Moobile.Window = new Class({

	Extends: Moobile.View,

	inputEnabled: true,

	inputMask: null,

	loadingIndicator: null,

	loadingIndicatorTimeout: null,

	options: {
		className: 'window',
		showLoadingIndicator: false,
		showLoadingIndicatorDelay: 0
	},

	initialize: function(element, options, name) {

		this.parent(element, options, name);

		if (instance == null) {
			instance = this;
			return this;
		}

		throw new Error('Only one window instance is allowed.');

		return this;
	},

	startup: function() {

		window.$moobile.window = this;

		if (this.ready == true)
			return this;

		this.ready = true;
		this.init();
		this.attachEvents();

		return this;
	},

	destroy: function() {

		window.$moobile = null;

		if (this.ready == false)
			return this;

		this.ready = false;
		this.detachEvents();
		this.release();

		instance = null;

		return this;
	},

	attachEvents: function() {
		window.addEvent('load', this.bound('onWindowLoad'));
		window.addEvent('orientationchange', this.bound('onWindowOrientationChange'));
		this.parent();
		return this;
	},

	detachEvents: function() {
		window.removeEvent('load', this.bound('onWindowLoad'));
		window.removeEvent('orientationchange', this.bound('onWindowOrientationChange'));
		this.parent();
		return this;
	},

	filterElement: function(element) {
		return element.getParent('[data-role]') == null;
	},

	position: function() {
		window.scrollTo(0, 1);
		return this;
	},

	getRootView: function() {
		return this.childViews[0];
	},

	getOrientation: function() {
		var o = Math.abs(window.orientation);
		switch (o) {
			case  0: return 'portrait';
			case 90: return 'landscape';
		}
	},

	enableInput: function() {
		if (this.inputEnabled == false) {
			this.inputEnabled = true;
			if (this.options.showLoadingIndicator) {
				this.hideLoadingIndicator();
				clearTimeout(this.loadingIndicatorTimeout);
			}
			this.hideMask();
		}
		return this;
	},

	disableInput: function() {
		if (this.inputEnabled == true) {
			this.inputEnabled = false;
			this.showMask();
			if (this.options.showLoadingIndicator) {
				this.loadingIndicatorTimeout = this.showLoadingIndicator.delay(this.options.showLoadingIndicatorDelay, this);
			}
		}
		return this;
	},

	showMask: function() {
		this.inputMask = new Element('div.' + this.options.className + '-mask');
		this.inputMask.inject(this.content);
		return this;
	},

	hideMask: function() {
		this.inputMask.destroy();
		this.inputMask = null;
		return this;
	},

	showLoadingIndicator: function() {
		if (this.inputMask) {
			this.inputMask.addClass('loading');
			this.loadingIndicator = new Element('div.' + this.options.className + '-loading-indicator');
			this.loadingIndicator.fade('hide');
			this.loadingIndicator.inject(this.inputMask);
			this.loadingIndicator.position()
			this.loadingIndicator.fade('show');
		}
		return this;
	},

	hideLoadingIndicator: function() {
		if (this.inputMask) {
			this.inputMask.removeClass('loading');
			if (this.loadingIndicator) {
				this.loadingIndicator.destroy();
				this.loadingIndicator = null;
			}
		}
		return this;
	},

	didAddChildView: function(view) {
		view.setWindow(this);
		view.setParentView(null);
		this.parent(view);
		return this;
	},

	onWindowOrientationChange: function() {
		this.position();
		this.fireEvent('orientationchange', this.getOrientation());
	},

	onWindowLoad: function(e) {
		this.position.delay(250);
		return this;
	}

});

Moobile.Window.extend({

	getInstance: function() {
		return instance;
	}

});

})();

/*
---

name: WindowController

description: Provides the starting poing view controller inside the window.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewController

provides:
	- WindowController

...
*/

Moobile.WindowController = new Class({

	Extends: Moobile.ViewController,

	rootViewController: null,

	initialize: function(viewElement, options) {
		this.parent(viewElement, options);
		this.window = this.view;
		this.window.startup();
		this.startup();
		return this;
	},

	setRootViewController: function(rootViewController) {

		if (this.rootViewController) {
			this.rootViewController.removeFromParentViewController();
			this.rootViewController.destroy();
			this.rootViewController = null;
		}

		if (rootViewController) {
			this.rootViewController = rootViewController;
			this.addChildViewController(rootViewController);
		}

		return this;
	},

	filterChildViewController: function(element) {
		return element.getParent('[data-role=view-controller]') == null;
	},

	loadView: function(viewElement) {
		this.view = Class.instanciate(
			viewElement.get('data-view') || 'Moobile.Window',
			viewElement
		);
		return this;
	},

	didAddChildViewController: function(viewController) {
		this.parent(viewController);
		this.rootViewController = viewController;
		return this;
	}

});

/*
---

name: Mouse

description: Maps mouse events to their touch counterparts

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Custom-Event/Element.defineCustomEvent, Browser.Features.Touch]

provides: Mouse

...
*/

if (!Browser.Features.Touch) (function(){

var condition = function(event){
	event.targetTouches = [];
	event.changedTouches = event.touches = [{
		pageX: event.page.x, pageY: event.page.y,
		clientX: event.client.x, clientY: event.client.y
	}];

	return true;
};

Element.defineCustomEvent('touchstart', {

	base: 'mousedown',

	condition: condition

}).defineCustomEvent('touchmove', {

	base: 'mousemove',

	condition: condition

}).defineCustomEvent('touchend', {

	base: 'mouseup',

	condition: condition

});

})();


/*
---

name: Pinch

description: Provides a custom pinch event for touch devices

authors: Christopher Beloch (@C_BHole), Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Element.Event, Custom-Event/Element.defineCustomEvent, Browser.Features.Touch]

provides: Pinch

...
*/

if (Browser.Features.Touch) (function(){

var name = 'pinch',
	thresholdKey = name + ':threshold',
	disabled, active;

var events = {

	touchstart: function(event){
		if (event.targetTouches.length == 2) active = true;
	},

	touchmove: function(event){
		event.preventDefault();

		if (disabled || !active) return;

		var threshold = this.retrieve(thresholdKey, 0.5);
		if (event.scale < (1 + threshold) && event.scale > (1 - threshold)) return;

		active = false;
		event.pinch = (event.scale > 1) ? 'in' : 'out';
		this.fireEvent(name, event);
	}

};

Element.defineCustomEvent(name, {

	onSetup: function(){
		this.addEvents(events);
	},

	onTeardown: function(){
		this.removeEvents(events);
	},

	onEnable: function(){
		disabled = false;
	},

	onDisable: function(){
		disabled = true;
	}

});

})();


/*
---

name: Swipe

description: Provides a custom swipe event for touch devices

authors: Christopher Beloch (@C_BHole), Christoph Pojer (@cpojer), Ian Collins (@3n)

license: MIT-style license.

requires: [Core/Element.Event, Custom-Event/Element.defineCustomEvent, Browser.Features.Touch]

provides: Swipe

...
*/

(function(){

var name = 'swipe',
	distanceKey = name + ':distance',
	cancelKey = name + ':cancelVertical',
	dflt = 50;

var start = {}, disabled, active;

var clean = function(){
	active = false;
};

var events = {

	touchstart: function(event){
		if (event.touches.length > 1) return;

		var touch = event.touches[0];
		active = true;
		start = {x: touch.pageX, y: touch.pageY};
	},
	
	touchmove: function(event){
		event.preventDefault();
		if (disabled || !active) return;
		
		var touch = event.changedTouches[0];
		var end = {x: touch.pageX, y: touch.pageY};
		if (this.retrieve(cancelKey) && Math.abs(start.y - end.y) > Math.abs(start.x - end.x)){
			active = false;
			return;
		}
		
		var distance = this.retrieve(distanceKey, dflt),
			diff = end.x - start.x,
			isLeftSwipe = diff < -distance,
			isRightSwipe = diff > distance;

		if (!isRightSwipe && !isLeftSwipe)
			return;
		
		active = false;
		event.direction = (isLeftSwipe ? 'left' : 'right');
		event.start = start;
		event.end = end;
		
		this.fireEvent(name, event);
	},

	touchend: clean,
	touchcancel: clean

};

Element.defineCustomEvent(name, {

	onSetup: function(){
		this.addEvents(events);
	},

	onTeardown: function(){
		this.removeEvents(events);
	},

	onEnable: function(){
		disabled = false;
	},

	onDisable: function(){
		disabled = true;
		clean();
	}

});

})();


/*
---

name: Touchhold

description: Provides a custom touchhold event for touch devices

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Element.Event, Custom-Event/Element.defineCustomEvent, Browser.Features.Touch]

provides: Touchhold

...
*/

(function(){

var name = 'touchhold',
	delayKey = name + ':delay',
	disabled, timer;

var clear = function(e){
	clearTimeout(timer);
};

var events = {

	touchstart: function(event){
		if (event.touches.length > 1){
			clear();
			return;
		}
		
		timer = (function(){
			this.fireEvent(name, event);
		}).delay(this.retrieve(delayKey) || 750, this);
	},

	touchmove: clear,
	touchcancel: clear,
	touchend: clear

};

Element.defineCustomEvent(name, {

	onSetup: function(){
		this.addEvents(events);
	},

	onTeardown: function(){
		this.removeEvents(events);
	},

	onEnable: function(){
		disabled = false;
	},

	onDisable: function(){
		disabled = true;
		clear();
	}

});

})();


/*
---

name: Class.Instantiate

description: Simple Wrapper for Mass-Class-Instantiation

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Class]

provides: Class.Instantiate

...
*/

Class.Instantiate = function(klass, options){
	var create = function(object){
		if (object.getInstanceOf && object.getInstanceOf(klass)) return;
		new klass(object, options);
	};
	
	return function(objects){
		objects.each(create);
	};
};
