#!/bin/bash

IN=$1
OUT=$2

if test -z "$OUT" ; then
    echo "no output name" >&2
    exit 1
fi

if test -z "$IN" ; then
    echo "no input file" >&2
    exit 1
fi

cat /dev/fd/3 /dev/fd/4 /dev/fd/5 > "$OUT" 3<<'EOF1' 4<<EOF2 5<<'EOF3'
<html>
<head>
<meta charset='UTF-8'>
<title>Emoji preview</title>
<script src='http://cdn.jsdelivr.net/emojione/1.5.0/lib/js/emojione.min.js'></script>
<link rel='stylesheet' href='http://cdn.jsdelivr.net/emojione/1.5.0/assets/css/emojione.min.css'>
<script>
window.onload = function() {
    var e = document.getElementById('main');
    var html = e.innerHTML;
    console.log(html);
    e.innerHTML = emojione.unicodeToImage(html);
};
</script>
</head>
<body>
<p id='main'>
EOF1
$(cat $1)
EOF2
</p>
</body>
</html>
EOF3
