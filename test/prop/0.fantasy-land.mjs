import FL from 'fantasy-laws';
import Z from 'sanctuary-type-classes';
import Future from '../../index.mjs';
import {assertEqual as eq, B, noop, STACKSIZE, bang} from '../util/util';
import {anyFuture, _of, nat, number, constant as _k} from '../util/props';

var Functor = FL.Functor;
var Alt = FL.Alt;
var Bifunctor = FL.Bifunctor;
var Apply = FL.Apply;
var Applicative = FL.Applicative;
var Chain = FL.Chain;
var ChainRec = FL.ChainRec;
var Monad = FL.Monad;

var I = function (x){ return x };
var sub3 = function (x){ return x - 3 };
var mul3 = function (x){ return x * 3 };
var query = function (x){ return x + '?' };

var of = function (x){
  return Z.of(Future, x);
};

function test (laws, name){
  var args = Array.prototype.slice.call(arguments, 2);
  it(name, laws[name].apply(null, args));
}

describe('Fantasy Land', function (){

  this.slow(200);
  this.timeout(5000);

  describe('Functor', function (){
    test(Functor(eq), 'identity', anyFuture);
    test(Functor(eq), 'composition', _of(number), _k(sub3), _k(mul3));
  });

  describe('Alt', function (){
    test(Alt(eq), 'associativity', anyFuture, anyFuture, anyFuture);
    test(Alt(eq), 'distributivity', _of(number), _of(number), _k(sub3));
  });

  describe('Bifunctor', function (){
    test(Bifunctor(eq), 'identity', anyFuture);
    test(Bifunctor(eq), 'composition', _of(number), _k(bang), _k(query), _k(sub3), _k(mul3));
  });

  describe('Apply', function (){
    test(Apply(eq), 'composition', _of(_k(sub3)), _of(_k(mul3)), _of(number));
  });

  describe('Applicative', function (){
    test(Applicative(eq, Future), 'identity', _of(number));
    test(Applicative(eq, Future), 'homomorphism', _k(sub3), number);
    test(Applicative(eq, Future), 'interchange', _of(_k(sub3)), number);
  });

  describe('Chain', function (){
    test(Chain(eq), 'associativity', _of(number), _k(B(of)(sub3)), _k(B(of)(mul3)));
  });

  describe('ChainRec', function (){
    test(
      ChainRec(eq, Future),
      'equivalence',
      _k(function (v){ return v < 1 }),
      _k(B(of)(function (v){ return v - 1 })),
      _k(of),
      nat.smap(x => Math.min(x, 100), I)
    );
    it('stack-safety', function (){
      var p = function (v){ return v > (STACKSIZE + 1) };
      var d = of;
      var n = B(of)(function (v){ return v + 1 });
      var a = Z.chainRec(Future, function (l, r, v){ return p(v) ? Z.map(r, d(v)) : Z.map(l, n(v)) }, 0);
      a._interpret(noop, noop, noop);
    });
  });

  describe('Monad', function (){
    test(Monad(eq, Future), 'leftIdentity', _k(B(of)(sub3)), _of(number));
    test(Monad(eq, Future), 'rightIdentity', anyFuture);
  });

});
