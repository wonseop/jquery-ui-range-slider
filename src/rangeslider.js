/**
	jQuery ui range slider
	 
	origin : colResizable v 1.3 - a jQuery plugin by Alvaro Prieto Lauroba( MIT & GPL )
	Licences: MIT
*/

( function ( $ ) {
	var $doc = $( document ),
		drag = null,
		tables = [],
		count = 0,
		SIGNATURE ="ui-table",
		isIE = ( navigator.userAgent.toLowerCase().indexOf( "msie" ) !== -1 ),
		_table,

		/**
		 * Function to allow column resizing for table objects. It is the starting point to apply the plugin.
		 * @param {DOM node} table - refrence to the DOM table object to be enhanced
		 * @param {Object} options	- some customization values
		 */
		init = function ( table, options ) {
			var $table = $( table );

			if ( options.disable ) {
				return destroy( $table );
			}

			_table = $table;

			$table.addClass( SIGNATURE ).before( "<div class=\"ui-grips\">" );
			$table.options = options;
			$table.grips = [];
			$table.columns = [];
			$table.w = $table.width();
			$table.gripContainer = $table.prev( ".ui-grips" );
			$table.cs = parseInt( isIE ? table.cellSpacing || table.currentStyle.borderSpacing : $table.css( "border-spacing" ), 10 ) || 2;
			$table.b  = parseInt( isIE ? table.border || table.currentStyle.borderLeftWidth : $table.css( "border-left-width" ), 10 ) || 1;
			//tables[ id ] = $table;
			createGrips( $table );
		},

		/**
		 * This function allows to remove any enhancements performed by this plugin on a previously processed table.
		 * @param {jQuery ref} $table - table object
		 */
		destroy = function ( $table ) {
			if ( !$table || !$table.is( "table" ) ) {
				return;
			}

			$table.removeClass( SIGNATURE ).gripContainer.remove();
		},

		/**
		 * Function to create all the grips associated with the table given by parameters 
		 * @param {jQuery ref} $table - table object
		 */
		createGrips = function ( $table ) {
			var th, column, grip;

			th = $table.find( ">thead>tr>th,>thead>tr>td" );
			if ( !th.length ) {
				th = $table.find( ">tbody>tr:first>th, >tr:first>th, >tbody>tr:first>td, >tr:first>td" );
			}

			$table.colgroup = $table.find( "col" );
			$table.ln = th.length;
			th.each( function ( i ) {
				column = $( this );
				grip = $( $table.gripContainer.append( "<div class=\"ui-grip\">" )[0].lastChild );
				grip.table = $table;
				grip.i = i;
				grip.column = column;
				column.w = column.width();
				$table.grips.push( grip );
				$table.columns.push( column );
				column.width( column.w ).removeAttr( "width" );

				if ( i < $table.ln - 1 ) {
					grip.on( "mousedown", onGripMouseDown )
						.append( "<div class=\"ui-handle\">" );
				} else {
					grip.addClass( "ui-grip-last" ).removeClass( "ui-grip" );
				}
				grip.data( SIGNATURE, { i: i } );
			});
			$table.colgroup.removeAttr( "width" );
			syncGrips( $table );

			$table.find( "td, th" ).not( th ).not( "table th, table td" ).each( function () {
				$( this ).removeAttr( "width" );
			});
		},

		/**
		 * Function that places each grip in the correct position according to the current table layout	 * 
		 * @param {jQuery ref} $table - table object
		 */
		syncGrips = function ( $table ) {
			var i, column;

			$table.gripContainer.width( $table.w );

			for ( i = 0; i < $table.ln; i++ ) {
				column = $table.columns[ i ];
				$table.grips[ i ].css( {
					left: column.offset().left - $table.offset().left + column.outerWidth() + $table.cs / 2 + "px",
					height: $table.options.headerOnly ? $table.columns[ 0 ].outerHeight() : $table.outerHeight() + "px"
				} );
			}
		},

		/**
		* This function updates column's width according to the horizontal position increment of the grip being
		* dragged. The function can be called while dragging if liveDragging is enabled and also from the onGripDragOver
		* event handler to synchronize grip's position with their related columns.
		* @param {jQuery ref} $table - table object
		* @param {nunmber} i - index of the grip being dragged
		* @param {bool} isOver - to identify when the function is being called from the onGripDragOver event	
		*/
		syncCols = function ( $table, i, isOver ) {
			var movement = drag.x - drag.l,
				column = $table.columns[ i ],
				column2 = $table.columns[ i + 1 ],
				width = column.w + movement,
				width2= column2.w - movement;

			column.width( width );
			column2.width( width2 );
			$table.colgroup.eq( i ).width( width );
			$table.colgroup.eq( i + 1 ).width( width2 );
			
			if ( isOver ) {
				column.w = width;
				column2.w = width2;
			}
		},

		/**
		 * Event handler fired when the grip's dragging is about to start. Its main goal is to set up events 
		 * and store some values used while dragging.
		 * @param {event} e - grip's mousedown event
		 */
		onGripMouseDown = function ( e ) {
			var data = $( this ).data( SIGNATURE ),
				$table = _table,
				grip = $table.grips[ data.i ],
				i, column;

			grip.pageX = e.pageX;
			grip.l = grip.position().left;

			$doc.on( "mousemove." + SIGNATURE, onGripDrag )
				.on( "mouseup." + SIGNATURE, onGripDragOver );
			grip.addClass( $table.options.draggingClass );
			drag = grip;

			if ( $table.columns[ data.i ].l ) {
				for ( i = 0; i < $table.ln; i++ ) {
					column = $table.columns[ i ];
					column.l = false;
					column.w = column.width();
				}
			}
			return false;
		},

		/**
		 * Event handler used while dragging a grip. It checks if the next grip's position is valid and updates it. 
		 * @param {event} e - mousemove event binded to the window object
		 */
		onGripDrag = function ( e ) {
			if ( !drag ) {
				return;
			}

			var $table = _table,//drag.table,
				x = e.pageX - drag.pageX + drag.l,
				mw = $table.options.minWidth,
				i = drag.i,
				l = $table.cs * 1.5 + mw + $table.b,
				max, min, callback;

			max = i == $table.ln - 1 ? $table.w - l : $table.grips[ i + 1 ].position().left - $table.cs - mw;
			min = i ? $table.grips[ i - 1 ].position().left + $table.cs + mw : l;
			
			x = Math.max( min, Math.min( max, x ) );
			drag.x = x;
			drag.css( "left",  x + "px" );

			if ( $table.options.liveDrag ) {
				syncCols( $table, i );
				syncGrips( $table );
				callback = $table.options.onDrag;

				if ( callback ) {
					e.currentTarget = $table[ 0 ];
					callback( e );
				}
			}
			return false;
		},

		/**
		 * Event handler fired when the dragging is over, updating table layout
		 */
		onGripDragOver = function ( e ) {
			var $table, callback;

			$doc.off( "mousemove." + SIGNATURE )
				.off( "mouseup." + SIGNATURE );

			if ( !drag ) {
				return;
			}

			drag.removeClass( _table.options.draggingClass );
			$table = _table;
			callback = $table.options.onResize;

			if ( drag.x ) {
				syncCols( $table, drag.i, true );
				syncGrips( $table );

				if ( callback ) {
					e.currentTarget = $table[ 0 ];
					callback( e );
				}
			}

			drag = null;
		},

		/**
		 * Event handler fired when the browser is resized. The main purpose of this function is to update
		 * table layout according to the browser's size synchronizing related grips 
		 */
		onResize = function () {
			var key, $table, i, minWidth;

			//for ( key in tables ) {
				//$table = tables[ key ];
				$table = _table;
				minWidth = 0;
				$table.removeClass( SIGNATURE );

				if ( $table.w !== $table.width() ) {
					$table.w = $table.width();

					for ( i = 0; i < $table.ln; i++ ) {
						minWidth += $table.columns[i].w;
					}

					for ( i = 0; i < $table.ln; i++ ) {
						$table.columns[ i ].css( "width", Math.round( 1000 * $table.columns[ i ].w / minWidth ) / 10 + "%" ).l = true; 
					}
				}
				syncGrips( $table.addClass( SIGNATURE ) );
			//}
		};

	$( window ).on( "resize." + SIGNATURE, onResize ); 

	/**
	 * The plugin is added to the jQuery library
	 * @param {Object} options -  an object containg some basic customization values 
	 */
	$.fn.extend( {
		rangeslider: function ( options ) {
			var defaults = {
				//attributes:
				draggingClass: 'ui-drag',
				liveDrag: true,
				minWidth: 8,
				headerOnly: false,
				hoverCursor: "e-resize",
				dragCursor: "e-resize",
				disable: false,
				//events:
				onDrag: null,
				onResize: null
			},
			options = $.extend( defaults, options );

			return this.each( function () {
				init( this, options );
			} );
		}
	} );
} ( jQuery ) );