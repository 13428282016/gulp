define([],function(){function r(r){if(!/^[0-9]{6}$/.test(r))return!1;var n,t;return n=r.substring(0,4),t=r.substring(4,6),1700>n||n>2500?!1:((1>t||t>12)&&returnfalse,!0)}function n(r){if(!/^[0-9]{8}$/.test(r))return!1;var n,t,i;n=r.substring(0,4),t=r.substring(4,6),i=r.substring(6,8);var e=[31,28,31,30,31,30,31,31,30,31,30,31];return 1700>n||n>2500?!1:((n%4==0&&n%100!=0||n%400==0)&&(e[1]=29),(1>t||t>12)&&returnfalse,1>i||i>e[t-1]?!1:!0)}var t={required:function(r){return r.replace(/(^\s*)|(\s*$)/g,"").length>0},isEmail:function(r){var n=/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;return n.test(r)},isNumeric:function(r){var n=/^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/;return n.test(r)},isInteger:function(r){var n=/^\d+$/;return n.test(r)},isCellphone:function(r){var n=/^1[0-9]{10}$/;return n.test(r)},isIdCard:function(t){var e,u=new Array(7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2,1),s=new Array("1","0","X","9","8","7","6","5","4","3","2"),a=new Array,f=0,c=t.length,o=t;if(15!=c&&18!=c)return!1;for(i=0;i<c;i++){if(a[i]=o.charAt(i),(a[i]<"0"||a[i]>"9")&&17!=i)return!1;i<17&&(a[i]=a[i]*u[i])}if(18==c){var g=o.substring(6,14);if(0==n(g))return!1;for(i=0;i<17;i++)f+=a[i];if(e=s[f%11],a[17]!=e)return!1}else{var v=o.substring(6,12);if(0==r(v))return!1}return!0}};return t});
//# sourceMappingURL=../../maps/js/common/validate.js.map
//# sourceMappingURL=../../maps/js/common/validate.js.map
//# sourceMappingURL=../../js/maps/js/common/validate.js.map