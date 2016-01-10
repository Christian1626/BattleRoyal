var map_size = 64;
var tile_width = 70;
var tile_height = 70;
var player_size_x = 10;
var player_size_y = 10;
var playerSpeed = 500;

//var scaleRatio = window.devicePixelRatio / 3;

var current_player = {};
var enemyPlayers;
var playersList ={};
var bulletVelocity = 700;
var id=1;
var dungeon = {};
var groundGroup;
var wallGroup;
var player;
var land;


var cursors;
var bullets;
var nextFire=0;
var fireRateGun = 150;
var fireRateRocket = 500;



var player_sprite;
var myPosition;
var ser


var text;
var style = { font: "30px Arial", fill: "#ffffff", align: "left" };



var socket;
var ready = false;

var socketClient = function() {
   // console.log("socketClient function");
    socket = io.connect('http://localhost:8080'); 
    current_player.username = prompt('Quel est votre pseudo ?');
    //current_player.username = "Test";

    //Sending to server 
    socket.emit('new_player',current_player.username);

    //player move
    socket.on('player_move',function(player){
        console.log('un player a bougé: '+player);
    });

    socket.on('current_player',function(player){

    });

    socket.on('getAllPlayers',function(enemies) {
        console.log("getallplayers");
        for (var id in enemies) {
            renderEnemy(enemies[id]);
        }
        
    });

    //new user
    socket.on('new_player',function(new_player){
        renderEnemy(new_player);
    });

    //dungeon
    socket.on('dungeon',function(map){
        dungeon = map;
        ready = true;
        create();
    });
}

var game = new Phaser.Game(window.innerWidth * window.devicePixelRatio, window.innerHeight* window.devicePixelRatio, 
    Phaser.AUTO, '', { preload: preload, create: socketClient, update: update });

function preload() {
    game.load.image('ground','tiles/ground.jpg');
    game.load.image('wall','tiles/wall.jpg');
    game.load.image('void','tiles/void.jpg');
    game.load.image('rocket','tiles/rocket.png');
    game.load.image('gun','tiles/gun.png');
    game.load.spritesheet('player', 'sprites/player.png', 32, 48);
}

function create() {
    game.world.setBounds(0, 0, map_size*tile_width, map_size*tile_height);
    game.stage.disableVisibilityChange  = true;
    game.physics.setBoundsToWorld();
    game.physics.startSystem(Phaser.Physics.ARCADE);
    
    renderMap();

    bullets = game.add.group();
    bullets.enableBody = true;

    player = new Player(current_player.id, game, player_sprite,current_player.username);
    playersList[current_player.id] = player;
    console.log("player:",playersList[current_player.id])
    current_player = player.player_sprite;
    current_player.x = 100;
    current_player.y = 100;

    //bullets = current_player.bullets;
	
    game.camera.follow(current_player);
   
    //controls
    cursors = game.input.keyboard.createCursorKeys();
    game.input.mouse.capture = true;


    text = game.add.text(game.camera.x,game.camera.y,"Bonjour !",style);

}


function update() {
    if (!ready) return;
    game.physics.arcade.collide(current_player, wallGroup);
    game.physics.arcade.collide(bullets, wallGroup, destroyAmmo);
    player.update();

}


function renderMap() {
    groundGroup = game.add.group();
    groundGroup.enableBody = true;
    wallGroup = game.add.group();
    wallGroup.enableBody = true;
	

    console.log("RenderMap");
    for (var y = 0; y < dungeon.map_size; y++) {
        for (var x = 0; x < dungeon.map_size; x++) {
            var tileSprite;
            var tile = dungeon.map[x][y];
            if (tile == 0)  {
                tileSprite = game.add.tileSprite(x*tile_width, y*tile_height, 'void');
            }
            else if (tile == 1) {
                tileSprite = groundGroup.create(x*tile_width, y*tile_height,'ground');
                tileSprite.body.immovable = true;
            }
            else {
                tileSprite = wallGroup.create(x*tile_width, y*tile_height,'wall');
                tileSprite.body.immovable = true;
            } 
            tileSprite.scale.set(tile_height/11 , tile_height/11 ); //TODO


           // this.ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
        }
    }
}

function renderEnemy(new_enemy) {
    //place player on random position
    console.log("new_enemy:",new_enemy);
    enemy  = new Player(id, game, player);
    enemy.player_sprite.x = new_enemy.x;
    enemy.player_sprite.y = new_enemy.y;
}

function random(min,max) {
    return Math.floor(Math.random() * max) + min;
}


////////////////////////////////////////////////////////////////////////////
//                             PLAYER
////////////////////////////////////////////////////////////////////////////

Player = function (index, game, player_sprite,username) {
    var x = 0;
    var y = 0;

    this.game = game;
    this.health = 30;
    this.player_sprite = player_sprite;
    this.username = username;

    this.availableWeapons = [new Weapon(game,"gun",150,0),new Weapon(game,"rocket",500,1)];
    this.actualWeapon = this.availableWeapons[0];

    this.bullets = game.add.group();
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.bullets.createMultiple(20, 'bullet', 0, false);
    this.bullets.setAll('anchor.x', 0.5);
    this.bullets.setAll('anchor.y', 0.5);
    this.bullets.setAll('outOfBoundsKill', true);
    this.bullets.setAll('checkWorldBounds', true);  
    
    this.currentSpeed =0;
    this.fireRate = 500;
    this.nextFire = 0;
    this.alive = true;

    this.player_sprite = game.add.sprite(x, y, 'player');
    this.player_sprite.anchor.set(0.5);

    this.player_sprite.id = index;
    game.physics.enable(this.player_sprite, Phaser.Physics.ARCADE);
    this.player_sprite.body.immovable = false;
    this.player_sprite.body.collideWorldBounds = true;
    this.player_sprite.body.bounce.setTo(0, 0);
    this.player_sprite.animations.add('left', [0, 1, 2, 3], 10, true);
    this.player_sprite.animations.add('right', [5, 6, 7, 8], 10, true);

};

Player.prototype.update = function() {

    text.position.setTo(game.camera.x+20,game.camera.y+20);
    text.setText("name: "+this.username+"\nlife: "+this.health+"\nweapon: "+this.actualWeapon.name);

    this.player_sprite.body.velocity.x = 0;
    this.player_sprite.body.velocity.y = 0;

    upKey = cursors.up.isDown || game.input.keyboard.isDown(Phaser.Keyboard.Z);
    downKey = cursors.down.isDown || game.input.keyboard.isDown(Phaser.Keyboard.S);
    leftKey = cursors.left.isDown || game.input.keyboard.isDown(Phaser.Keyboard.Q);
    rightKey = cursors.right.isDown || game.input.keyboard.isDown(Phaser.Keyboard.D);

    click = game.input.activePointer.isDown;

    rightClick = game.input.keyboard.isDown(Phaser.Keyboard.E);

    if (leftKey)
        {
            //  Move to the left
            this.player_sprite.body.velocity.x = -playerSpeed;
            this.player_sprite.animations.play('left');
        }

        if (rightKey)
        {
            //  Move to the right
            this.player_sprite.body.velocity.x = playerSpeed;
            this.player_sprite.animations.play('right');
        }

        if (upKey)
        {
            //  Move to the up
            this.player_sprite.body.velocity.y = -playerSpeed;
            this.player_sprite.animations.play('right');
        }

        if (downKey)
        {
            //  Move to the down
            this.player_sprite.body.velocity.y = playerSpeed;
            this.player_sprite.animations.play('right');
        }
        
        if(!(leftKey || rightKey || upKey || downKey))
        {
            //  Stand still
            this.player_sprite.animations.stop();
            this.player_sprite.frame = 4;
        }


        if(click){
            fire();
        }

        if(rightClick) {
            console.log("switch weapon");
            this.actualWeapon = this.availableWeapons[(this.actualWeapon.number+1)%this.availableWeapons.length];
        }

};


/*Player.prototype.fire = function(target) {
        if (!this.alive) return;
        if (this.game.time.now > this.nextFire && this.bullets.countDead() > 0)
        {
            this.nextFire = this.game.time.now + this.fireRate;
            var bullet = this.bullets.getFirstDead();
            bullet.reset(this.turret.x, this.turret.y);

            bullet.rotation = this.game.physics.arcade.moveToObject(bullet, target, 500);
        }
}*/


Player.prototype.kill = function() {
    this.alive = false;
    this.player_sprite.kill();
}


function destroyAmmo(ammo){
    ammo.kill();
}

function destroyAmmoAndPlayer(ammo,player){
    ammo.kill();
    player.kill();
}
/*
function fireRocket() {
    game.input.mouse.capture = true;

    console.log("fire");
    if(game.input.activePointer.isDown && player.weapon == "rocket") {

        console.log("shoot a rocke222");
        var missile = bullets.create(current_player.body.x+16,current_player.body.y+24,'rocket');    
        missile.rotation = game.physics.arcade.moveToPointer(missile,bulletVelocity,game.input.activePointer);
        
         //TODO: envoyer les missiles au server
    }     
}*/

function fire(){
    
    if(game.time.now > nextFire){
        nextFire = game.time.now + player.actualWeapon.fireRate;
        var projectile = bullets.create(current_player.body.x+16,current_player.body.y+24,player.actualWeapon.name);    
        projectile.rotation = game.physics.arcade.moveToPointer(projectile,bulletVelocity,game.input.activePointer);
    }
    

}

////////////////////////////////////////////////////////////////////////////
//                             WEAPON
////////////////////////////////////////////////////////////////////////////

Weapon = function (game,name,fireRate,number) {
    this.game = game;
    this.name = name;
    this.fireRate = fireRate;
    this.number = number;
}