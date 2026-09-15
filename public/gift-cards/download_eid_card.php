<?php
$files = glob('./txt2img/draw/*.php' );
foreach ( $files as $file )
    require( $file );
$files2 = glob('./txt2img/draw/Struct/*.php' );
foreach ( $files2 as $file2 )
    require( $file2 );
use GDText\Box;
use GDText\Color;

require('./txt2img/ar/arabic.php');
$Arabic = new \ArPHP\I18N\Arabic();

$image_link = './txt2img/eid.png';

$sender = htmlspecialchars($_GET['a']);
$sender = $Arabic->utf8Glyphs($sender);

$font = './txt2img/Tunisia.otf';

$im = imagecreatefrompng($image_link);

$box = new Box($im);
//$box->enableDebug();
$box->setFontFace($font);
// RGB color
$box->setFontColor(new Color(30, 98, 128));
$box->setFontSize(40);
// setBox($x, $y, $width, $height)
$box->setBox(200, 700, 400, 100);
$box->setTextAlign('center', 'top');
$box->setLineHeight(1.15);
$box->draw($sender);

header('Content-Type: image/png');
imagepng($im);
imagedestroy($im);

?>