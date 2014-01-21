( function ( $, undefined ) {

var $doc = $( document ),
	//drag = null,
	isIE = ( navigator.userAgent.toLowerCase().indexOf( "msie" ) !== -1 );

$.widget( "ui.rangeslider", {
	version: "0.1",
	options: {
		values: [
			{ "background-color": "green", "width": "25%" },
			{ "background-color": "yellow", "width": "25%" },
			{ "background-color": "orange", "width": "25%" },
			{ "background-color": "red", "width": "25%" }
		],
		draggingClass: 'ui-drag',
		liveDrag: true,
		disabled: null,
		minWidth: 8,
		onDrag: null
	},

	_create: function () {
		var $table = ( function ( values ) {
			var i,
				table = $( "<table class=\"ui-table\"><tr>" ),
				tr = table.find( "tr" );
			console.log( tr );

			for ( i = 0; i < values.length; i++ ) {
				$( "<td>" ).css( values[ i ] ).appendTo( tr );
				console.log( values[ i ] );
			}

			return table;
		} ( this.options.values ) );

		this.element.addClass( "ui-range-slider" )
			.append( "<div class=\"ui-grips\">" )
			.append( $table );

		$table.options = this.options;
		$table.grips = [];
		$table.columns = [];
		$table.w = $table.width();
		$table.gripContainer = $table.prev( ".ui-grips" );
		$table.cs = parseInt( isIE ? table.cellSpacing || table.currentStyle.borderSpacing : $table.css( "border-spacing" ), 10 ) || 2;
		$table.b  = parseInt( isIE ? table.border || table.currentStyle.borderLeftWidth : $table.css( "border-left-width" ), 10 ) || 1;
		this._table = $table;

		this._drag = null;
		this.createGrips( $table );
	},

	_destroy: function () {
		this.element.removeClass( "ui-range-slider" ).empty();
	},

	createGrips: function ( $table ) {
			var th, column, grip,
				self = this;

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
					grip.on( "mousedown", function ( e ) { self.onGripMouseDown( e ) } )
						.append( "<div class=\"ui-handle\">" );
				} else {
					grip.addClass( "ui-grip-last" ).removeClass( "ui-grip" );
				}
				grip.data( "ui-table", { i: i } );
			});
			$table.colgroup.removeAttr( "width" );
			this.syncGrips( $table );

			$table.find( "td, th" ).not( th ).not( "table th, table td" ).each( function () {
				$( this ).removeAttr( "width" );
			});
		},

	syncGrips: function ( $table ) {
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

	syncCols: function ( $table, i, isOver ) {
		var movement = this._drag.x - this._drag.l,
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

	onGripMouseDown: function ( e ) {
		var self = this,
			data = $( e.currentTarget ).data( "ui-table" ),
			$table = this._table,
			grip = $table.grips[ data.i ],
			i, column;

		grip.pageX = e.pageX;
		grip.l = grip.position().left;

		$doc.on( "mousemove.ui-table", function ( e ) { self.onGripDrag( e ) } )
			.on( "mouseup.ui-table", function ( e ) { self.onGripDragOver( e ) } );
		grip.addClass( $table.options.draggingClass );
		this._drag = grip;

		if ( $table.columns[ data.i ].l ) {
			for ( i = 0; i < $table.ln; i++ ) {
				column = $table.columns[ i ];
				column.l = false;
				column.w = column.width();
			}
		}
		return false;
	},

	onGripDrag: function ( e ) {
		if ( !this._drag ) {
			return;
		}

		var $table = this._table,
			x = e.pageX - this._drag.pageX + this._drag.l,
			mw = $table.options.minWidth,
			i = this._drag.i,
			l = $table.cs * 1.5 + mw + $table.b,
			max, min, callback;

		max = i == $table.ln - 1 ? $table.w - l : $table.grips[ i + 1 ].position().left - $table.cs - mw;
		min = i ? $table.grips[ i - 1 ].position().left + $table.cs + mw : l;
		
		x = Math.max( min, Math.min( max, x ) );
		this._drag.x = x;
		this._drag.css( "left",  x + "px" );

		if ( $table.options.liveDrag ) {
			this.syncCols( $table, i );
			this.syncGrips( $table );
			callback = $table.options.onDrag;

			if ( callback ) {
				e.currentTarget = $table[ 0 ];
				callback( e );
			}
		}
		return false;
	},

	onGripDragOver: function ( e ) {
		var $table, callback;

		$doc.off( "mousemove.ui-table" )
			.off( "mouseup.ui-table" );

		if ( !this._drag ) {
			return;
		}

		this._drag.removeClass( this._table.options.draggingClass );
		$table = this._table;
		callback = $table.options.onResize;

		if ( this._drag.x ) {
			this.syncCols( $table, this._drag.i, true );
			this.syncGrips( $table );

			if ( callback ) {
				e.currentTarget = $table[ 0 ];
				callback( e );
			}
		}

		this._drag = null;
	},

	onResize: function () {
		var key, $table, i, minWidth;

		$table = _table;
		minWidth = 0;
		$table.removeClass( "ui-table" );

		if ( $table.w !== $table.width() ) {
			$table.w = $table.width();

			for ( i = 0; i < $table.ln; i++ ) {
				minWidth += $table.columns[i].w;
			}

			for ( i = 0; i < $table.ln; i++ ) {
				$table.columns[ i ].css( "width", Math.round( 1000 * $table.columns[ i ].w / minWidth ) / 10 + "%" ).l = true; 
			}
		}
		this.syncGrips( $table.addClass( "ui-table" ) );
	}
} );

} ( jQuery ) );