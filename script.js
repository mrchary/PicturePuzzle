//Global variables
var puzzleColNum = 4;
var puzzleRowNum = 3;
var canvPadding = 5;
var tilePadding = 2;
var randomizeNumber = 25;
var canvColor = "#333333";
var canvTileWidth, canvTileHeight;
var canvOffsetX, canvOffsetY;
var puzzleTiles = new Array();

var mouseBtnDown = false;
var startPointerX, startPointerY;
var startCol, startRow;
var delta = 50;
var isAnimation = false;

var currentImgNum = 0;
var timer;
var puzzleTime = new Object();
var puzzleEnabled = false;

function initPage()
{
	//Resize canvas
	var canvas = document.getElementById("canv");
	canvas.width = document.getElementById("content").clientWidth;
	canvas.height = document.getElementById("content").clientHeight;
	
	//"Next" image vertical align
	var nextImg = document.getElementById("next");
	var footer = document.getElementById("footer");
	nextImg.style.top = Math.floor((footer.clientHeight - nextImg.clientHeight) / 2).toString() + "px";
	
	//Show title image
	var canvCtx = canvas.getContext("2d");
	var titleImg = new Image();
	titleImg.onload = function()
	{
		var titleX = Math.floor((canvas.width - titleImg.width) / 2);
		var titleY = Math.floor((canvas.height - titleImg.height) / 2);
		canvCtx.drawImage(titleImg, titleX, titleY);
	}
	titleImg.src = "ui/title.jpg";
}

function nextDown()
{
	document.getElementById("next").src = "ui/next-down.png";
}

function nextUp()
{
	document.getElementById("next").src = "ui/next-up.png";
}

function loadPuzzle()
{
	//Get current image number
	var imgNumFromCookie = getCookie("imgNum");
	if(imgNumFromCookie != undefined) currentImgNum = imgNumFromCookie;
	
	//Load puzzle
	puzzleColNum = imgBase[currentImgNum].cols;
	puzzleRowNum = imgBase[currentImgNum].rows;
	loadPicture(imgBase[currentImgNum].imgFile);
	
	//Hide image data and show time
	document.getElementById("imgAuthor").style.display = "none";
	document.getElementById("imgName").style.display = "none";
	document.getElementById("time").innerHTML = "00:00";
	document.getElementById("time").style.display = "block";
	
	//Hide "next" image
	document.getElementById("next").style.visibility = "hidden";
	
	//Start timer
	puzzleTime.minutes = 0;
	puzzleTime.seconds = 0;
	timer = setInterval(function()
	{
		puzzleTime.seconds++;
		if(puzzleTime.seconds >= 60)
		{
			puzzleTime.seconds = 0;
			puzzleTime.minutes++;
		}
		if(puzzleTime.minutes >= 60)
		{
			puzzleTime.minutes = 0;
		}
		
		var min = puzzleTime.minutes.toString();
		if(puzzleTime.minutes < 10) min = "0" + min;
		var sec = puzzleTime.seconds.toString();
		if(puzzleTime.seconds < 10) sec = "0" + sec;
		
		document.getElementById("time").innerHTML = min + ":" + sec;
	}, 1000);
	
	puzzleEnabled = true;
	document.getElementById("canv").style.cursor = "pointer";
}

function setCookie(name, value, exdays)
{
	//Define expire date
	var expDate = new Date();
	expDate.setDate(expDate.getDate() + exdays);
	
	//Set cookie
	document.cookie = name + "=" + value + "; expires=" + expDate.toUTCString();
}

function getCookie(name)
{
	var cookiesArray = document.cookie.split(";");
	var i, cookie;
	
	for(i = 0; i < cookiesArray.length; i++)
	{
		cookie = cookiesArray[i].split("=");
		if(cookie[0] == name) return cookie[1];
	}
}

function loadPicture(pictureName)
{
	var canvas = document.getElementById("canv");
	var canvCtx = canvas.getContext("2d");
	
	var img = new Image();
	img.onload = function()
	{
		var imgTileWidth = Math.floor(img.width / puzzleColNum);
		var imgTileHeight = Math.floor(img.height / puzzleRowNum);
		
		var widthRatio = (canvas.width - 2 * canvPadding - 2 * tilePadding * puzzleColNum) / img.width;
		var heightRatio = (canvas.height - 2 * canvPadding - 2 * tilePadding * puzzleRowNum) / img.height;
		var ratio = Math.min(widthRatio, heightRatio);
		canvTileWidth = Math.floor(ratio * imgTileWidth);
		canvTileHeight = Math.floor(ratio * imgTileHeight);
		
		//Calculate offsets to center image
		canvOffsetX = 0;
		canvOffsetY = 0;
		if(ratio == heightRatio)
		{
			canvOffsetX = Math.floor((canvas.width - 2 * canvPadding - puzzleColNum * (canvTileWidth + 2 * tilePadding)) / 2);
		}
		else
		{
			canvOffsetY = Math.floor((canvas.height - 2 * canvPadding - puzzleRowNum * (canvTileHeight + 2 * tilePadding)) / 2);
		}
		
		var i, j;
		var sx, sy;
		for(j = 0; j < puzzleRowNum; j++)
		{
			sy = j * imgTileHeight;
			puzzleTiles[j] = new Array();
			for(i = 0; i < puzzleColNum; i++)
			{
				sx = i * imgTileWidth;
				canvCtx.drawImage(img, sx, sy, imgTileWidth, imgTileHeight, 0, 0, canvTileWidth, canvTileHeight);
				
				puzzleTiles[j][i] = new Object();
				puzzleTiles[j][i].realX = i;
				puzzleTiles[j][i].realY = j;
				puzzleTiles[j][i].imgData = canvCtx.getImageData(0, 0, canvTileWidth, canvTileHeight);
			}
		}
		
		clearCanvas();
		randomizeTiles();
		renderCanvas();
	}
	img.src = pictureName;
}

function clearCanvas()
{
	var canvas = document.getElementById("canv");
	var canvCtx = canvas.getContext("2d");
	canvCtx.fillStyle = canvColor;
	canvCtx.fillRect(0, 0, canvas.width, canvas.height);
}

function swapTiles(firstTileCol, firstTileRow, secondTileCol, secondTileRow)
{
	if((firstTileCol < 0) || (firstTileCol >= puzzleColNum)) return;
	if((firstTileRow < 0) || (firstTileRow >= puzzleRowNum)) return;
	if((secondTileCol < 0) || (secondTileCol >= puzzleColNum)) return;
	if((secondTileRow < 0) || (secondTileRow >= puzzleRowNum)) return;
	
	var Buf = puzzleTiles[firstTileRow][firstTileCol];
	puzzleTiles[firstTileRow][firstTileCol] = puzzleTiles[secondTileRow][secondTileCol];
	puzzleTiles[secondTileRow][secondTileCol] = Buf;
}

function getRandom(Max)   //Returns random integer value from 0 to Max
{
	return Math.round(Math.random() * Max);
}

function randomizeTiles()
{
	var firstCol, firstRow, secondCol, secondRow;
	for(var i = 0; i < randomizeNumber; i++)
	{
		firstCol = getRandom(puzzleColNum - 1);
		firstRow = getRandom(puzzleRowNum - 1);
		secondCol = getRandom(puzzleColNum - 1);
		secondRow = getRandom(puzzleRowNum - 1);
		
		swapTiles(firstCol, firstRow, secondCol, secondRow);
	}
}

function renderCanvas()
{
	var canvas = document.getElementById("canv");
	var canvCtx = canvas.getContext("2d");
	var i, j;
	var x = canvPadding + tilePadding + canvOffsetX;
	var y = canvPadding + tilePadding + canvOffsetY;
	var startX = x;
	
	for(j = 0; j < puzzleRowNum; j++)
	{
		for(i = 0; i < puzzleColNum; i++)
		{
			canvCtx.putImageData(puzzleTiles[j][i].imgData, x, y);
			x += canvTileWidth + 2 * tilePadding;
		}
		y += canvTileHeight + 2 * tilePadding;
		x = startX;
	}
}

//Mouse events handling

function mouseDown(event)
{
	if(!puzzleEnabled) return;
	
	var content = document.getElementById("content");
	var imgLeft = content.offsetLeft + canvPadding + canvOffsetX;
	var imgRight = imgLeft + puzzleColNum * (canvTileWidth + 2 * tilePadding);
	var imgTop = content.offsetTop + canvPadding + canvOffsetY;
	var imgBottom = imgTop + puzzleRowNum * (canvTileHeight + 2 * tilePadding);
	startPointerX = event.clientX;
	startPointerY = event.clientY;
	
	if((startPointerX < imgLeft) || (startPointerX > imgRight)) return;
	if((startPointerY < imgTop) || (startPointerY > imgBottom)) return;
	
	startCol = Math.floor((startPointerX - imgLeft) / (canvTileWidth + 2 * tilePadding));
	startRow = Math.floor((startPointerY - imgTop) / (canvTileHeight + 2 * tilePadding));
	if((startCol < 0) || (startCol >= puzzleColNum)) return;
	if((startRow < 0) || (startRow >= puzzleRowNum)) return;
	if(isAnimation) return;
	
	mouseBtnDown = true;
	document.getElementById("canv").style.cursor = "move";
}

function mouseUp()
{
	if(!puzzleEnabled) return;
	
	mouseBtnDown = false;
	document.getElementById("canv").style.cursor = "pointer";
}

function mouseMove(event)
{
	if(!puzzleEnabled) return;
	if(mouseBtnDown == false) return;
	
	var deltaX = event.clientX - startPointerX;
	var deltaY = event.clientY - startPointerY;
	
	var endCol, endRow;
	if(Math.abs(deltaX) > delta)
	{
		if(deltaX < 0) endCol = startCol - 1;
		else           endCol = startCol + 1;
		endRow = startRow;
	}
	else if(Math.abs(deltaY) > delta)
	{
		if(deltaY < 0) endRow = startRow - 1;
		else           endRow = startRow + 1;
		endCol = startCol;
	}
	else return;
	
	mouseBtnDown = false;
	if((endCol < 0) || (endCol >= puzzleColNum)) return;
	if((endRow < 0) || (endRow >= puzzleRowNum)) return;
	
	animateSwap(startCol, startRow, endCol, endRow);
	swapTiles(startCol, startRow, endCol, endRow);
	
	if(puzzleResolved()) showResult();
}

function animateSwap(firstCol, firstRow, secondCol, secondRow)
{
	var firstShiftX = 0;
	var firstShiftY = 0;
	var secondShiftX = 0;
	var secondShiftY = 0;
	
	if(firstRow == secondRow)
	{
		if((secondCol - firstCol) == 1)
		{
			firstShiftX = 1;
			secondShiftX = -1;
		}
		else if((secondCol - firstCol) == -1)
		{
			firstShiftX = -1;
			secondShiftX = 1;
		}
		else return;
	}
	else if(firstCol == secondCol)
	{
		if((secondRow - firstRow) == 1)
		{
			firstShiftY = 1;
			secondShiftY = -1;
		}
		else if((secondRow - firstRow) == -1)
		{
			firstShiftY = -1;
			secondShiftY = 1;
		}
		else return;
	}
	else return;
	
	var canvas = document.getElementById("canv");
	var canvCtx = canvas.getContext("2d");
	canvCtx.fillStyle = canvColor;
	
	var firstTileX = canvPadding + canvOffsetX + (canvTileWidth + 2 * tilePadding) * firstCol + tilePadding;
	var firstTileY = canvPadding + canvOffsetY + (canvTileHeight + 2 * tilePadding) * firstRow + tilePadding;
	var secondTileX = canvPadding + canvOffsetX + (canvTileWidth + 2 * tilePadding) * secondCol + tilePadding;
	var secondTileY = canvPadding + canvOffsetY + (canvTileHeight + 2 * tilePadding) * secondRow + tilePadding;
	
	var firstX = firstTileX;
	var firstY = firstTileY;
	var secondX = secondTileX;
	var secondY = secondTileY;
	
	var firstTile = canvCtx.getImageData(firstTileX, firstTileY, canvTileWidth, canvTileHeight);
	var secondTile = canvCtx.getImageData(secondTileX, secondTileY, canvTileWidth, canvTileHeight);
	
	//Animation cycle
	isAnimation = true;
	var interval = setInterval(function()
	{
		//Clear old tile's positions
		canvCtx.fillRect(firstX, firstY, canvTileWidth, canvTileHeight);
		canvCtx.fillRect(secondX, secondY, canvTileWidth, canvTileHeight);
		
		//Modify tile's positions
		firstX += firstShiftX;
		firstY += firstShiftY;
		secondX += secondShiftX;
		secondY += secondShiftY;
		
		//Put tiles to the new positions
		canvCtx.putImageData(secondTile, secondX, secondY);
		canvCtx.putImageData(firstTile, firstX, firstY);
		
		//Animation stop condition
		if((firstX == secondTileX) && (firstY == secondTileY))
		{
			clearInterval(interval);
			isAnimation = false;
		}
	}, 1);
}

function puzzleResolved()   //Returns true, if puzzle resolved. Otherwise returns false.
{
	var i, j;
	for(j = 0; j < puzzleRowNum; j++)
	{
		for(i = 0; i < puzzleColNum; i++)
		{
			if(puzzleTiles[j][i].realX != i) return false;
			if(puzzleTiles[j][i].realY != j) return false;
		}
	}
	return true;
}

function showResult()
{
	//Wait for animation stop
	var interval = setInterval(function()
	{
		if(isAnimation == false)
		{
			puzzleEnabled = false;
			document.getElementById("canv").style.cursor = "default";
			
			//Hide time and show image data
			document.getElementById("time").style.display = "none";
			document.getElementById("imgAuthor").innerHTML = imgBase[currentImgNum].imgAuthor;
			document.getElementById("imgName").innerHTML = '"' + imgBase[currentImgNum].imgName + '"';
			document.getElementById("imgAuthor").style.display = "block";
			document.getElementById("imgName").style.display = "block";
			
			//Update current image number
			currentImgNum++;
			if(currentImgNum >= imgBase.length) currentImgNum = 0;
			setCookie("imgNum", currentImgNum, 365);
			
			//Stop timer
			clearInterval(timer);
			
			//Show "next" image
			document.getElementById("next").style.visibility = "visible";
			
			clearInterval(interval);
		}
	}, 500);
}