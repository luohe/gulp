/*! functions.js */
"use strict";
  import $ from 'jquery';
  import 'babel-polyfill';
  console.log($);
  var test = value => console.log(value);
  
  test('testtestesstet');
  test(2222222222222222);
  test(2222222222222222);
  test(2222222222222222);

function* g1() {
  yield 2;
  yield 3;
  yield 4;
}

function* g2() {
  yield 1;
  yield* g1();
  yield 5;
}

var iterator = g2();

console.log(iterator.next()); // { value: 1, done: false }
console.log(iterator.next()); // { value: 2, done: false }
console.log(iterator.next()); // { value: 3, done: false }
console.log(iterator.next()); // { value: 4, done: false }
console.log(iterator.next()); // { value: 5, done: false }
console.log(iterator.next()); // { value: undefined, done: true }


var live  ='直播中';

  var option = `<div class="ctnPanel">
                    <div class="imgBox">
                        <img src="../images/headImg.jpg" alt="">
                        <div class="live">
                            <div class=""></div>
                        </div>
                    </div>
                    <div class="livePInfo">
                        <span class="anchorName">文Mn婷儿的我们</span>
                        <span class="right">
                            <span></span>11165
                        </span>
                    </div>
                    <div class="panelTag">录播</div>
                </div>
                <div class="ctnPanel">
                    <div class="imgBox">
                        <img src="../images/headImg.jpg" alt="">
                        <div class="live">
                            <div class=""></div>
                        </div>
                    </div>
                    <div class="livePInfo">
                        <span class="anchorName">文Mn婷儿的我们</span>
                        <span class="right">
                            <span class="currentLiveIcon"></span>11165
                        </span>
                    </div>
                    <div class="panelTag">${live}</div>
                </div>`;
    
$('.anchorList').html(option);
 