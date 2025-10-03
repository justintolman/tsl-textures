//	TSL-Textures: Marble

import { Color } from "three";
import { add, div, exp, Fn, Loop, mix, If, mul, oneMinus, positionGeometry, pow } from 'three/tsl';
import { noise, prepare, TSLFn } from './tsl-utils.js';

let defaults = {
	$name: 'Marble',
	//mottling
	mottled: true,
	scale: 2.0,
	iterations: 8,
	amount: -0.3,
	opacity: 0.5,
	noise: 0.5,
	noiseScale: 0.5,

	//veining
	v_scale: 1.2,
	v_thinness: 5,

	color: new Color( 0x4545D3 ),
	background: new Color( 0xF0F8FF ),

	seed: 0,
};

let _mottle = Fn( ( params )=>{

	let pos = positionGeometry.mul( exp( params.scale.div( 4 ).add( -1 ) ) ).add( params.seed ).toVar( );

	let amount = params.amount.mul( noise( pos.mul( params.amount.div( 2 ).add( 4 ) ) ).add( 4 ) ).toVar();

	let k = noise( pos ).toVar();

	Loop( params.iterations, ()=>{

		pos.mulAssign( 2 );
		k.addAssign( noise( pos ) );

	} );

	k.subAssign( noise( pos.mul( 2 ) ).abs() );

	k.assign( k.sub( amount ).clamp( 0, 15 ) );

	return k;

} );

let mottle = TSLFn( ( params )=>{

	params = prepare( params, defaults );

	let k = _mottle( params ).mul( 1.25 ).pow( 0.5 );

	let pos = positionGeometry.mul( exp( params.scale.add( params.noiseScale.mul( 3 ), 2 ) ) );

	k.addAssign( params.noise.mul( noise( pos ).abs().add( 0.1 ).pow( 2 ) ) );

	return mix( params.color, params.background, k );

}, defaults );

mottle.opacity = TSLFn( ( params )=>{

	params = prepare( params, defaults );

	let k = _mottle( params ).mul( params.opacity.add( 0.2 ) );

	return k.oneMinus();

}, defaults );

let veigns = TSLFn( ( params ) => {

	params = prepare( params, defaults );

	let pos = positionGeometry.mul( exp( params.v_scale ) ).add( params.seed ).toVar( );

	let k = add(
		noise( pos ),
		noise( pos.mul( 2 ) ).mul( 0.5 ),
		noise( pos.mul( 6 ) ).mul( 0.1 )
	);

	k = oneMinus( k.abs().pow( 2.5 ) ).toVar();

	let	maxSmooth = oneMinus( pow( 0.5, params.v_thinness.add( 7 ) ) ).toVar(),
		minSmooth = oneMinus( pow( 0.5, params.v_thinness.add( 7 ).mul( 0.5 ) ) ).toVar();

	If( k.greaterThan( maxSmooth ), ()=>{

		k.assign( 1 );

	} )
		.ElseIf( k.lessThan( minSmooth ), ()=>{

			k.assign( 0 );

		} )
		.Else( ()=> {

			let a = k.sub( minSmooth );
			let b = maxSmooth.sub( minSmooth );
			k.assign( pow( div( a, b ), 5 ).mul( 0.75 ) );
			k.assign( k.mul( add( 0.5, noise( pos.mul( 2 ) ).mul( 1.5 ) ) ) );

		} );

	k.assign( k.add( mul( params.noise, noise( pos.mul( 150 ) ).abs().pow3() ) ) );

	return mix( params.background, params.color, k );

}, defaults );

let marble = (params) =>{
	let mot = ( typeof params.mottled === 'undefined' ) ? defaults.mottled : params.mottled;
	if ( !mot ) return veigns( params );
	return mix( mottle( params ), veigns( params ), 0.5 );
}

export { marble };
