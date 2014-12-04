angular.module 'smart.layout', []
  .directive 'smartLayout', ['$parse', '$window', 'parseSize', ($parse, $window, parseSize) ->
    restrict: 'A'
    scope: true
    link: (scope, elem, attrs) ->
      class Layout
        constructor: () ->
          elem.addClass 'layout-stretch'
          layoutOption = $parse(attrs.smartLayout) scope
          @layoutDirection = if layoutOption.direction is 'column' then 'column' else 'row'
          @items = []
          @spliters = []
          @fixedSizeTotal = 0
          @spliterSizeTotal = 0
          @fixedItemIdxs = []
          @itemMinSizeTotal = 0
          @activeSpliterIdx = 0
          @itemAll = []
          @sizeType =
            size: if @layoutDirection is 'column' then 'width' else 'height'
            osize: if @layoutDirection is 'column' then 'height' else 'width'
            offset: if @layoutDirection is 'column' then 'offsetWidth' else 'offsetHeight'
            from: if @layoutDirection is 'column' then 'left' else 'top'
            to: if @layoutDirection is 'column' then 'right' else 'bottom'
            begin: if @layoutDirection is 'column' then 'top' else 'left'
            end: if @layoutDirection is 'column' then 'bottom' else 'right'
            coord: if @layoutDirection is 'column' then 'pageX' else 'pageY'
            spliterCursor: if @layoutDirection is 'column' then 'col-resize' else 'row-resize'

          for child, index in elem.children()
            child = angular.element child
            child.css 'position', "absolute"
            child.css @sizeType.begin, 0
            child.css @sizeType.end, 0
            
            if angular.isUndefined child.attr('layout-spliter')
              item = {}
              item.elem = child
              item.fixed = angular.isDefined item.elem.attr('fixed')
              item.size = parseSize.size item.elem.attr('size')
              item.maxSize = parseSize.max item.elem.attr('max-size')
              item.minSize = parseSize.min item.elem.attr('min-size')
              if item.minSize > item.maxSize
                k = item.minSize
                item.minSize = item.maxSize
                item.maxSize = k
              if item.fixed
                @fixedSizeTotal += item.size
                @fixedItemIdxs.push index
              else
                @itemMinSizeTotal += item.minSize
              @items.push item
            else
              spliter = {}
              spliter.preItemIdx = @items.length - 1
              spliter.nextItemIdx = @items.length
              spliter.elem = child
              if @spliters[@spliters.length - 1] and @spliters[@spliters.length - 1].preItemIdx is spliter.preItemIdx
                spliter.elem.remove()
                return
              spliterOption = $parse(spliter.elem.attr('layout-spliter'))(scope) ? {}
              collapseOption = $parse(spliter.elem.attr('collapsable'))(scope) ? {}
              spliter.size = parseSize.spliter(spliterOption.size)
              spliter.color = spliterOption.color ? '#222'
              spliter.collapsable = angular.isDefined spliter.elem.attr('collapsable')
              if spliter.collapsable
                spliter.collapsed = false
                spliter.collapseDirection = collapseOption.direction ? 'pre'
                spliter.collapseColor = collapseOption.color ? '#ddd'
                spliter.elem.html '<div class="collapse" style="position: absolute; cursor: pointer"><svg><path /></svg></div>'
                spliter.collapse = spliter.elem.children()
                spliter.collapse.css @sizeType.begin, '50%'
                spliter.collapse.find('svg').css @sizeType.osize, "#{spliter.size * 4}px"
                spliter.collapse.css "margin-#{@sizeType.begin}", "-#{spliter.size * 2}px"
                @setCollapseStyle(spliter.collapse, spliter.size, @layoutDirection, spliter.collapseDirection)
                spliter.collapse.find('path').css 'fill', spliter.collapseColor
              spliter.elem.css 'cursor', @sizeType.spliterCursor
              spliter.elem.css 'background-color', spliter.color
              @spliters.push spliter
          splitersTmp = []
          for spliter, index in @spliters
            preItem = @items[spliter.preItemIdx]
            nextItem = @items[spliter.nextItemIdx]
            if angular.isUndefined(preItem) or preItem.fixed or angular.isUndefined(nextItem) or nextItem.fixed
              spliter.elem.remove()
            else
              if spliter.collapsable
                spliter.preDivBoth = Math.max(preItem.size, 20) / (Math.max(nextItem.size, 20) + Math.max(nextItem.size, 20))
              splitersTmp.push spliter
              @spliterSizeTotal += spliter.size
          @spliters = splitersTmp
          for item, itemIndex in @items
            @itemAll.push {type: 'item', index: itemIndex}
            for spliter, spliterIndex in @spliters
              if spliter.preItemIdx is itemIndex
                @itemAll.push {type: 'spliter', index: spliterIndex}
                break
          elem.css "min-#{@sizeType.size}", parseSize.toPixel(@fixedSizeTotal + @spliterSizeTotal + @itemMinSizeTotal)
        setCollapseStyle: (collapse, size, type, direction) ->
          if type is 'column'
            if direction is 'pre'
              path = "m#{size-1} #{size} l-#{size-2} #{size} l#{size-2} #{size}z"
            else
              path = "m1 #{size} l#{size-2} #{size} l-#{size-2} #{size}z"
          else
            if direction is 'pre'
              path = "m#{size} #{size-1} l#{size} -#{size-2} l#{size} #{size-2}z"
            else
              path = "m#{size} 1 l#{size} #{size-2} l#{size} -#{size-2}z"
          collapse.find('path').attr "d", path
        toggleCollapse: (spliter) ->
          console.log spliter
          pre = @items[spliter.preItemIdx]
          next = @items[spliter.nextItemIdx]
          rawSizeBoth = pre.size + next.size
          if spliter.collapsed
            pre.size = rawSizeBoth * spliter.preDivBoth
            console.log pre.size
          else
            if spliter.collapseDirection is 'pre'
              pre.size = pre.minSize
            else
              pre.size = rawSizeBoth - next.minSize
          next.size = rawSizeBoth - pre.size
          if not (pre.minSize <= pre.size <= pre.maxSize)
            pre.size = Math.max pre.minSize, Math.min(pre.size, pre.maxSize)
            next.size = rawSizeBoth - pre.size
          if not (next.minSize <= next.size <= next.maxSize)
            next.size = Math.max next.minSize, Math.min(next.size, next.maxSize)
            pre.size = rawSizeBoth - next.size
          @raw()
          spliter.collapsed = not spliter.collapsed
          if spliter.collapseDirection is 'pre'
            @setCollapseStyle(spliter.collapse, spliter.size, @layoutDirection, if spliter.collapsed then 'next' else 'pre')
          else
            @setCollapseStyle(spliter.collapse, spliter.size, @layoutDirection, if spliter.collapsed then 'pre' else 'next')
          angular.element($window).triggerHandler('resize')

        resize: () ->
          @layoutSize = elem[0][@sizeType.offset]
          rest = Math.max(@layoutSize - @spliterSizeTotal - @fixedSizeTotal, 0)
          readyItemidxs = angular.copy @fixedItemIdxs
          readyItemidxs.push -1
          readyItemidxsLast = []
          while readyItemidxsLast.length < readyItemidxs.length
            readyItemidxsLast = angular.copy readyItemidxs
            restRaw = 0
            for item, index in @items
              if not item.fixed and index not in readyItemidxs
                restRaw += item.size
            restRaw = Math.max(restRaw, 1)
            for item, index in @items
              if not item.fixed and index not in readyItemidxs
                item.size = item.size * rest / restRaw
                if item.size > item.maxSize or item.size < item.minSize
                  item.size = Math.min Math.max(item.size, item.minSize), item.maxSize
                  readyItemidxs.push index
                  rest = Math.max(rest - item.size, 0)
          @raw()
          @layoutSize = elem[0][@sizeType.offset]
        raw: () ->
          cSize = 0
          for item in @itemAll
            if item.type is 'item'
              cItem = @items[item.index]
            else
              cItem =  @spliters[item.index]
            cItem.elem.css @sizeType.from, parseSize.toPixel(cSize)
            cItem.elem.css @sizeType.size, parseSize.toPixel(cItem.size)
            cSize += cItem.size
          return
        registerObservers: () ->
          @resize()
          setTimeout () =>
            angular.element($window).triggerHandler('resize')
          , 200
          angular.element($window).on 'resize', () => @resize(); return
          for spliter in @spliters
            if spliter.collapsable
              spliter.collapse.on 'click', ((spliter) =>
                (evt) =>
                  @toggleCollapse(spliter)
              )(spliter)
            spliter.elem.on 'mousedown', ((spliter) =>
              (evt) =>
                spliter.from = evt[@sizeType.coord]
                evt.preventDefault()
                evt.stopPropagation()
                angular.element($window).on 'mousemove', (evt) =>
                    spliter.to = evt[@sizeType.coord]
                    pre = @items[spliter.preItemIdx]
                    next = @items[spliter.nextItemIdx]
                    if (spliter.to > spliter.from and pre.size < pre.maxSize and next.size > next.minSize) or
                    (spliter.to < spliter.from and pre.size > pre.minSize and next.size < next.maxSize)
                      rawSizeBoth = pre.size + next.size
                      pre.size += spliter.to - spliter.from
                      next.size -= spliter.to - spliter.from
                      if not (pre.minSize <= pre.size <= pre.maxSize)
                        pre.size = Math.max pre.minSize, Math.min(pre.size, pre.maxSize)
                        next.size = rawSizeBoth - pre.size
                      if not (next.minSize <= next.size <= next.maxSize)
                        next.size = Math.max next.minSize, Math.min(next.size, next.maxSize)
                        pre.size = rawSizeBoth - next.size
                      @raw()
                      angular.element($window).triggerHandler('resize')
                    spliter.from = spliter.to
            )(spliter)
          angular.element($window).on 'mouseup', (evt) =>
            angular.element($window).off 'mousemove'
          return
      new Layout().registerObservers()
      return
  ]
  .factory 'parseSize', [() ->
    base = (defaultVal, size) ->
      if angular.isUndefined size
        return defaultVal
      size = parseInt size, 10
      if isNaN(size)
        return defaultVal
      size
    size: angular.bind this, base, 20
    max: angular.bind this, base, 99999
    min: angular.bind this, base, 0
    spliter: angular.bind this, base, 5
    toPixel: (size) ->
      size + 'px'
  ]

