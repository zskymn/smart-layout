var __indexOf = [].indexOf || function(item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (i in this && this[i] === item) {
      return i;
    }
  }
  return -1;
};

angular.module('smart.layout', []).directive('smartLayout', [
  '$parse', '$window', '$timeout', 'parseSize', '_debounceResize',
  function($parse, $window, $timeout, parseSize, _debounceResize) {
    return {
      restrict: 'A',
      scope: true,
      priority: 99,
      link: function(scope, elem, attrs) {
        var Layout;
        Layout = (function() {
          function Layout() {
            var child, collapseOption, index, item, itemIndex, k, layoutOption, nextItem,
              preItem, spliter, spliterIndex, spliterOption, splitersTmp, _i, _j, _k, _l, _len,
              _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
            elem.css({
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              overflow: 'auto'
            });
            layoutOption = $parse(attrs.smartLayout)(scope);
            this.layoutDirection = layoutOption.direction === 'column' ? 'column' : 'row';
            this.items = [];
            this.spliters = [];
            this.fixedSizeTotal = 0;
            this.spliterSizeTotal = 0;
            this.fixedItemIdxs = [];
            this.itemMinSizeTotal = 0;
            this.activeSpliterIdx = 0;
            this.spliterIsActive = false;
            this.itemAll = [];
            this.sizeType = {
              size: this.layoutDirection === 'column' ? 'width' : 'height',
              osize: this.layoutDirection === 'column' ? 'height' : 'width',
              offset: this.layoutDirection === 'column' ? 'offsetWidth' : 'offsetHeight',
              from: this.layoutDirection === 'column' ? 'left' : 'top',
              to: this.layoutDirection === 'column' ? 'right' : 'bottom',
              begin: this.layoutDirection === 'column' ? 'top' : 'left',
              end: this.layoutDirection === 'column' ? 'bottom' : 'right',
              coord: this.layoutDirection === 'column' ? 'pageX' : 'pageY',
              spliterCursor: this.layoutDirection === 'column' ? 'col-resize' : 'row-resize'
            };
            _ref = elem.children();
            for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
              child = _ref[index];
              child = angular.element(child);
              child.css('position', "absolute");
              child.css(this.sizeType.begin, 0);
              child.css(this.sizeType.end, 0);
              child.css('overflow', 'auto');
              if (angular.isUndefined(child.attr('layout-spliter'))) {
                item = {};
                item.elem = child;
                item.fixed = angular.isDefined(item.elem.attr('fixed'));
                item.size = parseSize.size(item.elem.attr('size'));
                item.maxSize = parseSize.max(item.elem.attr('max-size'));
                item.minSize = parseSize.min(item.elem.attr('min-size'));
                if (item.minSize > item.maxSize) {
                  k = item.minSize;
                  item.minSize = item.maxSize;
                  item.maxSize = k;
                }
                if (item.fixed) {
                  this.fixedSizeTotal += item.size;
                  this.fixedItemIdxs.push(index);
                } else {
                  this.itemMinSizeTotal += item.minSize;
                }
                this.items.push(item);
              } else {
                child.css('overflow', 'hidden');
                spliter = {};
                spliter.preItemIdx = this.items.length - 1;
                spliter.nextItemIdx = this.items.length;
                spliter.elem = child;
                if (this.spliters[this.spliters.length - 1] && this.spliters[this.spliters.length - 1].preItemIdx === spliter.preItemIdx) {
                  spliter.elem.remove();
                  return;
                }
                spliterOption = (_ref1 = $parse(spliter.elem.attr('layout-spliter'))(scope)) != null ? _ref1 : {};
                collapseOption = (_ref2 = $parse(spliter.elem.attr('collapsable'))(scope)) != null ? _ref2 : {};
                spliter.size = parseSize.spliter(spliterOption.size);
                spliter["class"] = (_ref3 = spliterOption["class"]) != null ? _ref3 : 'layout-spliter';
                spliter.collapsable = angular.isDefined(spliter.elem.attr('collapsable'));
                if (spliter.collapsable) {
                  spliter.collapsed = false;
                  spliter.collapseDirection = (_ref4 = collapseOption.direction) != null ? _ref4 : 'pre';
                  spliter.elem.html('<div style="position: absolute; cursor: pointer"><svg><path /></svg></div>');
                  spliter.collapse = spliter.elem.children();
                  spliter.collapse.css(this.sizeType.begin, '50%');
                  spliter.collapse.find('svg').css(this.sizeType.osize, "" + (spliter.size * 4) + "px");
                  spliter.collapse.css("margin-" + this.sizeType.begin, "-" + (spliter.size * 2) + "px");
                  this.setCollapseStyle(spliter.collapse, spliter.size, this.layoutDirection, spliter.collapseDirection);
                }
                spliter.elem.css('cursor', this.sizeType.spliterCursor);
                spliter.elem.addClass(spliter["class"]);
                this.spliters.push(spliter);
              }
            }
            splitersTmp = [];
            _ref5 = this.spliters;
            for (index = _j = 0, _len1 = _ref5.length; _j < _len1; index = ++_j) {
              spliter = _ref5[index];
              preItem = this.items[spliter.preItemIdx];
              nextItem = this.items[spliter.nextItemIdx];
              if (angular.isUndefined(preItem) || preItem.fixed || angular.isUndefined(nextItem) || nextItem.fixed) {
                spliter.elem.remove();
              } else {
                if (spliter.collapsable) {
                  spliter.preDivBoth = Math.max(preItem.size, 20) / (Math.max(preItem.size, 20) + Math.max(nextItem.size, 20));
                }
                splitersTmp.push(spliter);
                this.spliterSizeTotal += spliter.size;
              }
            }
            this.spliters = splitersTmp;
            _ref6 = this.items;
            for (itemIndex = _k = 0, _len2 = _ref6.length; _k < _len2; itemIndex = ++_k) {
              item = _ref6[itemIndex];
              this.itemAll.push({
                type: 'item',
                index: itemIndex
              });
              _ref7 = this.spliters;
              for (spliterIndex = _l = 0, _len3 = _ref7.length; _l < _len3; spliterIndex = ++_l) {
                spliter = _ref7[spliterIndex];
                if (spliter.preItemIdx === itemIndex) {
                  this.itemAll.push({
                    type: 'spliter',
                    index: spliterIndex
                  });
                  break;
                }
              }
            }
            elem.css("min-" + this.sizeType.size, parseSize.toPixel(this.fixedSizeTotal + this.spliterSizeTotal + this.itemMinSizeTotal));
          }

          Layout.prototype.setCollapseStyle = function(collapse, size, type, direction) {
            var path;
            if (type === 'column') {
              if (direction === 'pre') {
                path = "m" + (size - 1) + " " + size + " l-" + (size - 2) + " " + size + " l" + (size - 2) + " " + size + "z";
              } else {
                path = "m1 " + size + " l" + (size - 2) + " " + size + " l-" + (size - 2) + " " + size + "z";
              }
            } else {
              if (direction === 'pre') {
                path = "m" + size + " " + (size - 1) + " l" + size + " -" + (size - 2) + " l" + size + " " + (size - 2) + "z";
              } else {
                path = "m" + size + " 1 l" + size + " " + (size - 2) + " l" + size + " -" + (size - 2) + "z";
              }
            }
            collapse.find('path').attr("d", path);
          };

          Layout.prototype.toggleCollapse = function(spliter) {
            var next, pre, rawSizeBoth, _ref, _ref1;
            pre = this.items[spliter.preItemIdx];
            next = this.items[spliter.nextItemIdx];
            rawSizeBoth = pre.size + next.size;
            if (spliter.collapsed) {
              pre.size = rawSizeBoth * spliter.preDivBoth;
            } else {
              if (spliter.collapseDirection === 'pre') {
                pre.size = pre.minSize;
              } else {
                pre.size = rawSizeBoth - next.minSize;
              }
            }
            next.size = rawSizeBoth - pre.size;
            if (!((pre.minSize <= (_ref = pre.size) && _ref <= pre.maxSize))) {
              pre.size = Math.max(pre.minSize, Math.min(pre.size, pre.maxSize));
              next.size = rawSizeBoth - pre.size;
            }
            if (!((next.minSize <= (_ref1 = next.size) && _ref1 <= next.maxSize))) {
              next.size = Math.max(next.minSize, Math.min(next.size, next.maxSize));
              pre.size = rawSizeBoth - next.size;
            }
            this.raw();
            spliter.collapsed = !spliter.collapsed;
            if (spliter.collapseDirection === 'pre') {
              this.setCollapseStyle(spliter.collapse, spliter.size, this.layoutDirection, spliter.collapsed ? 'next' : 'pre');
            } else {
              this.setCollapseStyle(spliter.collapse, spliter.size, this.layoutDirection, spliter.collapsed ? 'pre' : 'next');
            }
            _debounceResize();
          };

          Layout.prototype.resize = function() {
            var index, item, layoutSizeLast, readyItemidxs, readyItemidxsLast, rest, restRaw, _i, _j, _len, _len1, _ref, _ref1;
            layoutSizeLast = this.layoutSize;
            this.layoutSize = elem[0][this.sizeType.offset];
            rest = Math.max(this.layoutSize - this.spliterSizeTotal - this.fixedSizeTotal, 0);
            readyItemidxs = angular.copy(this.fixedItemIdxs);
            readyItemidxs.push(-1);
            readyItemidxsLast = [];
            while (readyItemidxsLast.length < readyItemidxs.length) {
              readyItemidxsLast = angular.copy(readyItemidxs);
              restRaw = 0;
              _ref = this.items;
              for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
                item = _ref[index];
                if (!item.fixed && __indexOf.call(readyItemidxs, index) < 0) {
                  restRaw += item.size;
                }
              }
              restRaw = Math.max(restRaw, 1);
              _ref1 = this.items;
              for (index = _j = 0, _len1 = _ref1.length; _j < _len1; index = ++_j) {
                item = _ref1[index];
                if (!item.fixed && __indexOf.call(readyItemidxs, index) < 0) {
                  item.size = item.size * rest / restRaw;
                  if (item.size > item.maxSize || item.size < item.minSize) {
                    item.size = Math.min(Math.max(item.size, item.minSize), item.maxSize);
                    readyItemidxs.push(index);
                    rest = Math.max(rest - item.size, 0);
                  }
                }
              }
            }
            this.raw();
            if (Math.abs(layoutSizeLast - this.layoutSize) > 5) {
              _debounceResize();
            }
          };

          Layout.prototype.raw = function() {
            var cItem, cSize, item, _i, _len, _ref;
            cSize = 0;
            _ref = this.itemAll;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              item = _ref[_i];
              if (item.type === 'item') {
                cItem = this.items[item.index];
              } else {
                cItem = this.spliters[item.index];
              }
              cItem.elem.css(this.sizeType.from, parseSize.toPixel(cSize));
              cItem.elem.css(this.sizeType.size, parseSize.toPixel(cItem.size));
              cSize += cItem.size;
            }
          };

          Layout.prototype.registerObservers = function() {
            var spliter, spliter_idx, _i, _len, _ref;
            this.resize();
            _debounceResize();
            angular.element($window).on('resize', (function(_this) {
              return function() {
                _this.resize();
              };
            })(this));
            _ref = this.spliters;

            function spliterCollapseClickHandler(_this, spliter) {
              return function() {
                _this.toggleCollapse(spliter);
              };
            }

            function spliterMousedownHandler(_this, spliter, spliter_idx) {
              return function(evt) {
                spliter.from = evt[_this.sizeType.coord];
                spliter.delta = 0;
                evt.preventDefault();
                evt.stopPropagation();
                _this.spliterIsActive = true;
                angular.element($window).on('mousemove', function(evt) {
                  var next, pre, rawSizeBoth, _ref1, _ref2;
                  _this.activeSpliterIdx = spliter_idx;
                  spliter.elem.css('z-index', 99999);
                  spliter.to = evt[_this.sizeType.coord];
                  pre = _this.items[spliter.preItemIdx];
                  next = _this.items[spliter.nextItemIdx];
                  if ((spliter.to > spliter.from && pre.size < pre.maxSize && next.size > next.minSize) || (spliter.to < spliter.from && pre.size > pre.minSize && next.size < next.maxSize)) {
                    rawSizeBoth = pre.size + next.size;
                    pre.size += spliter.to - spliter.from;
                    next.size -= spliter.to - spliter.from;
                    if (!((pre.minSize <= (_ref1 = pre.size) && _ref1 <= pre.maxSize))) {
                      pre.size = Math.max(pre.minSize, Math.min(pre.size, pre.maxSize));
                      next.size = rawSizeBoth - pre.size;
                    }
                    if (!((next.minSize <= (_ref2 = next.size) && _ref2 <= next.maxSize))) {
                      next.size = Math.max(next.minSize, Math.min(next.size, next.maxSize));
                      pre.size = rawSizeBoth - next.size;
                    }
                    spliter.elem.css(_this.sizeType.from, parseSize.toPixel(parseInt(spliter.elem.css(_this.sizeType.from), 10) + spliter.to - spliter.from));
                  }
                  spliter.from = spliter.to;
                });
              };
            }

            for (spliter_idx = _i = 0, _len = _ref.length; _i < _len; spliter_idx = ++_i) {
              spliter = _ref[spliter_idx];
              if (spliter.collapsable) {
                spliter.collapse.on('click', spliterCollapseClickHandler(this, spliter));
              }
              spliter.elem.on('mousedown', spliterMousedownHandler(this, spliter, spliter_idx));
            }

            angular.element($window).on('mouseup', (function(_this) {
              return function() {
                if (_this.spliterIsActive) {
                  _this.raw();
                  _debounceResize();
                  _this.spliters[_this.activeSpliterIdx].elem.css('z-index', 'inherit');
                  angular.element($window).off('mousemove');
                  return;
                }
                return _this.spliterIsActive = false;
              };
            })(this));
          };

          return Layout;

        })();
        new Layout().registerObservers();
      }
    };
  }
]).factory('parseSize', [
  function() {
    var base;
    base = function(defaultVal, size) {
      if (angular.isUndefined(size)) {
        return defaultVal;
      }
      size = parseInt(size, 10);
      if (isNaN(size)) {
        return defaultVal;
      }
      return size;
    };
    return {
      size: angular.bind(this, base, 20),
      max: angular.bind(this, base, 99999),
      min: angular.bind(this, base, 0),
      spliter: angular.bind(this, base, 5),
      toPixel: function(size) {
        return size + 'px';
      }
    };
  }
]).factory('_debounceResize', [
  '$timeout', '$window',
  function($timeout, $window) {
    var _debounce;
    _debounce = function(func, wait) {
      var timeout;
      timeout = null;
      return function() {
        var args, context, later;
        context = this;
        args = arguments;
        later = function() {
          timeout = null;
          return func.apply(context, args);
        };
        if (timeout) {
          $timeout.cancel(timeout);
        }
        timeout = $timeout(later, wait);
      };
    };
    return _debounce(function() {
      angular.element($window).triggerHandler('resize');
    }, 300);
  }
]);
