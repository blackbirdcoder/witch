import kaboom from 'kaboom';
import { zzfx } from '../www/libs/zzfx.micro.js';

const settings = {
    color: {
        gold: [222, 158, 65],
        accent: [165, 48, 48],
        fill: [23, 32, 56],
        life: [117, 167, 67],
        dust: [87, 114, 119],
        hit: [222, 158, 65],
        natural: [255, 255, 255],
        effect: [207, 87, 60],
        sting: [165, 48, 48],
    },
    colorLuck: [
        [79, 143, 186],
        [117, 167, 67],
        [192, 148, 115],
        [190, 119, 43],
        [162, 62, 140],
    ],
    colorFailure: [
        [168, 181, 178],
        [199, 207, 204],
        [21, 29, 40],
    ],
    font: 'PixelifySans-Regular',
    bottleName: 'bottle',
    skullName: 'skull',
    winnerName: 'winner',
    loserName: 'loser',
    bonusName: 'bonus',
    ingredientNames: ['carrot', 'beetroot', 'acorn', 'amanita', 'onion', 'tooth'],
    amountIngredients: { min: 1, max: 2 }, // max 10
    maxBottles: 2, // max 10
    bonusSpawnTime: 60, // 60
    scene: {
        size: {
            width: 800,
            height: 600,
        },
        id: 'game',
        scale: 1,
        frequencySpawn: 2,
        gravity: 1600,
    },
    shortSounds: {
        pot: [4.2, 0, 55, 0.02, 0.01, 0.16, 1, 1.9, 17, 28, , , , , , 0.1, , 0.63, 0.01, , -300],
        vapor: [, 0, 100, 0.12, 0.1, , 4, 0.3, 6, , 250, -0.05, 0.03, 0.3, , , 0.12, 0.5, , 0.02],
        done: [0.8, 0, 100, 0.9, 0.26, 0.22, 1, , , , 233, 0.06, 0.08, 1, , , 1, 0.68, , , 242],
        damage: [0.5, 0, 100, , 0.06, 0.26, 2, 1.6, , , , , , , , , , 0.87, 0.07],
        bonus: [, 0, 200, 0.5, 0.25, 0.35, , 10, -1, -42, 11, , 0.3, , , , 1, 0.52, 0.3, , 155],
    },
};

function Ingredient(k, settingsIngredientNames) {
    this.tags = settingsIngredientNames;
    this._collection = [];
    this.size = {
        width: 64,
        height: 64,
    };
    this.scale = 0.8;
    this.gravityScale = 0.1;
    this.collider = {
        position: { x: 15, y: 12 },
        size: {
            width: 35,
            height: 35,
        },
    };
    this.damageHero = 10;
    this.top = 2;

    this.createSprites = function () {
        this.tags.forEach((item) => {
            this._collection.push(k.loadSprite(item, `sprites/${item}.png`));
        });
    };

    this.spawn = function (settingsFrequencySpawn) {
        k.loop(settingsFrequencySpawn, () => {
            const currentIngredientName = this.tags[k.randi(this.tags.length)];
            const activeIngredient = k.add([
                k.sprite(currentIngredientName),
                k.scale(this.scale),
                k.pos(k.rand(this.size.width, k.width() - this.size.width), -this.size.height * this.top),
                k.area({
                    shape: new k.Rect(
                        k.vec2(this.collider.position.x, this.collider.position.y),
                        this.collider.size.width,
                        this.collider.size.height
                    ),
                }),
                k.body({ gravityScale: this.gravityScale }),
                {
                    forename: currentIngredientName,
                },
            ]);

            activeIngredient.onCollide(() => {
                activeIngredient.destroy(activeIngredient);
            });
        });
    };
}

function Ground(k) {
    this.tag = 'ground';
    this._span = 0;
    this.size = {
        width: 64,
        height: 64,
    };
    this.isStatic = true;
    this._locationZ = -10;

    this.createSprite = function () {
        k.loadSprite(this.tag, `sprites/${this.tag}.png`);
    };

    this.calculateSpan = function (sceneLength) {
        this._span = Math.ceil(sceneLength / this.size.width);
    };

    this.helperPlatform = function (bgColor) {
        k.add([
            k.pos(0, k.height() - this.size.height),
            k.rect(k.width(), this.size.width),
            k.color(bgColor),
            k.area(),
            k.body({ isStatic: true }),
            k.z(this._locationZ),
            {
                forename: this.tag,
            },
        ]);
    };

    this.create = function (sceneHeight) {
        for (let step = 0; step < this._span; step++) {
            k.add([
                k.sprite(this.tag),
                k.pos(step * this.size.width, sceneHeight - this.size.width),
                k.area(),
                k.body({ isStatic: this.isStatic }),
                this.tag,
                {
                    forename: this.tag,
                },
            ]);
        }
    };
}

function Background(k) {
    this.tag = 'background';
    this.scale = 2;

    this.createSprite = function () {
        k.loadSprite(this.tag, `sprites/${this.tag}.png`);
    };

    this.create = function () {
        k.add([k.sprite(this.tag), k.scale(this.scale), k.pos(0, 0)]);
    };
}

function Player(k, settingsColorNatural) {
    this.tag = 'hero';
    this.gameObject = null;
    this.scale = 2;
    this.fullHealth = 100;
    this.body = {
        gravityScale: 2,
        maxVelocity: 700,
        jumpForce: 800,
    };
    this.speed = 100;
    this.maxSpeed = this.speed * 2;
    this._cutting = {
        sliceX: 6,
        sliceY: 3,
        anims: {
            idle: {
                from: 0,
                to: 5,
                loop: true,
                speed: 4,
            },
            run: {
                from: 6,
                to: 11,
                loop: true,
            },
            jump: {
                from: 12,
                to: 17,
            },
        },
    };
    this._initialPosition = { x: 0, y: 0 };
    this._size = {
        width: 64,
        height: 64,
    };
    this.colliderPlayer = { pos: { x: 7, y: 0 }, size: { width: 20, height: this._size.height } };
    this.colliderAccessory = { pos: { x: 30, y: 30 }, size: { width: 25, height: 15 }, offset: { x: 2, y: 0 } };
    this.accessoryName = 'pot';
    this.turnCorrectionStatus = {
        right: false,
        left: true,
    };
    this.turnColliderRelocation = {
        left: {
            parent: 38,
            child: 6,
        },
        right: {
            parent: 7,
            child: 30,
        },
    };
    this._potion = 0;
    this._restrictMove = {
        left: undefined,
        right: undefined,
    };

    this.createSprite = function () {
        k.loadSprite(this.tag, `sprites/${this.tag}.png`, this._cutting);
    };

    this.create = function () {
        this.gameObject = k.add([
            k.sprite(this.tag, { anim: 'idle' }),
            k.scale(this.scale),
            k.pos(this._initialPosition.x, this._initialPosition.y),
            k.timer(),
            k.area({
                shape: new k.Rect(
                    k.vec2(this.colliderPlayer.pos.x, this.colliderPlayer.pos.y),
                    this.colliderPlayer.size.width,
                    this.colliderPlayer.size.height
                ),
            }),
            k.body(this.body),
            k.health(this.fullHealth),
            k.color(settingsColorNatural),
            this.tag,
            {
                forename: this.tag,
                bottlePoison: 0,
            },
        ]);
    };

    this.addPot = function (ignore) {
        this.gameObject.add([
            k.pos(0, 0),
            k.area({
                shape: new k.Rect(
                    k.vec2(this.colliderAccessory.pos.x, this.colliderAccessory.pos.y),
                    this.colliderAccessory.size.width,
                    this.colliderAccessory.size.height
                ),
                offset: k.vec2(this.colliderAccessory.offset.x, 0),
                collisionIgnore: ignore,
            }),
            k.body({ isStatic: true }),
            {
                forename: this.accessoryName,
                collectedIngredients: {
                    carrot: 0,
                    beetroot: 0,
                    acorn: 0,
                    amanita: 0,
                    onion: 0,
                    tooth: 0,
                },
            },
        ]);
    };

    this.calculateInitialPosition = function (sceneWidth, sceneHeight) {
        this._initialPosition.x = sceneWidth / 2 - this._size.width;
        this._initialPosition.y = sceneHeight - this._size.height * 3;
        return this._initialPosition;
    };

    this.turnStatusSwitch = function () {
        this.turnCorrectionStatus['right'] = !this.turnCorrectionStatus['right'];
        this.turnCorrectionStatus['left'] = !this.turnCorrectionStatus['left'];
    };

    this.makingPotions = function (recipe) {
        const state = { potion: this._potion, reboot: false, newRecipe: false };
        const collections = this.gameObject.children[0].collectedIngredients;
        let precisionCounter = 0;
        for (const keyRecipe of Object.keys(recipe)) {
            if (collections[keyRecipe] === recipe[keyRecipe]) {
                precisionCounter += 1;
            } else if (collections[keyRecipe] > recipe[keyRecipe]) {
                for (const key of Object.keys(collections)) {
                    collections[key] = 0;
                }
                state['reboot'] = true;
                return state;
            }

            if (precisionCounter === Object.keys(recipe).length) {
                for (const key of Object.keys(collections)) {
                    collections[key] = 0;
                }
                this._potion += 1;
                state['potion'] = this._potion;
                state['newRecipe'] = true;
                return state;
            }
        }
        return state;
    };

    this.calculateRestrict = function (sceneWidth) {
        const cleanLook = 16;
        this._restrictMove.right = sceneWidth - (this._size.width * this.scale - cleanLook);
        this._restrictMove.left = sceneWidth - (sceneWidth + cleanLook);
        return this._restrictMove;
    };
}

function ScreenStart(k, settings) {
    this._pictureTitleSize = {
        width: 350,
        height: 128,
    };
    this._positionalPictureTitle = { x: 0, y: 0 };
    this._pictureControlSize = {
        width: 85,
        height: 115,
    };
    this._fontName = settings.font;
    this._styleText = { size: 30, width: 500, align: 'center' };
    this._positionalText = { x: 0, y: 0 };
    this._color = settings.color;
    this._picturesNames = ['title', 'control'];
    this.scale = 2;
    this.pictureControlIdent = { x: 100, y: 115 };
    this.dialogPosition = { position: { x: 200, y: 390 }, step: 60 };
    this.dialog = {
        start: '[gold]To start the game Press[/gold] [accent]ENTER[/accent]',
        moving: '[gold]Moving[/gold]',
        jump: '[gold]Jump[/gold]',
        restart: '[gold]Restart[/gold]',
    };

    this.create = function () {
        for (const item of this._picturesNames) {
            k.loadSprite(item, `sprites/${item}.png`);
        }
        return this._picturesNames;
    };

    this.fontCreate = function () {
        k.loadFont(`${this._fontName}`, `fonts/${this._fontName}.ttf`);
    };

    this.getColorText = function () {
        this._styleText['font'] = this._fontName;
        this._styleText['styles'] = {
            gold: (idx, ch) => ({
                color: k.rgb(this._color.gold),
            }),
            accent: (idx, ch) => ({
                color: k.rgb(this._color.accent),
            }),
        };
        return this._styleText;
    };

    this.calculateTextPosition = function () {
        this._positionalText.x = settings.scene.size.width / 2 - this._styleText['width'] / 2;
        this._positionalText.y = settings.scene.size.height / 2 - 30;
    };

    this.calculatePicturePosition = function () {
        this._positionalPictureTitle.x = (settings.scene.size.width - this._pictureTitleSize.width) / 10;
        return this._positionalPictureTitle;
    };

    this.banner = function () {
        k.add([
            k.sprite(this._picturesNames[0]),
            k.scale(this.scale),
            k.pos(this._positionalPictureTitle.x, this._positionalPictureTitle.y),
        ]);
    };

    this.textContinue = function (textStyle) {
        k.add([k.pos(this._positionalText.x, this._positionalText.y), k.text(this.dialog['start'], textStyle)]);
    };

    this.control = function () {
        k.add([
            k.sprite(this._picturesNames[1]),
            k.pos(
                this._positionalText.x + this.pictureControlIdent.x,
                this._positionalText.y + this.pictureControlIdent.y
            ),
            k.scale(this.scale * 0.7),
        ]);
    };

    this.descriptionControl = function () {
        for (const key of Object.keys(this.dialog).slice(1)) {
            k.add([
                k.pos(this.dialogPosition.position.x, this.dialogPosition.position.y),
                k.text(this.dialog[key], this.getColorText()),
            ]);
            this.dialogPosition.position.y += this.dialogPosition.step;
        }
    };
}

function UserInterface(k, settings) {
    this._color = settings.color;
    this._fontName = settings.font;
    this.layerIngredientScale = null;
    this._texts = [];
    this.layerBottlePoison = null;
    this.bottlesCountText = null;
    this._bottleName = settings.bottleName;
    this._skullName = settings.skullName;
    this._layerSkull = null;
    this.healthBar = null;
    this._healthBarBackground = null;
    this._healthBarForeground = null;
    this.healthBarLength = 135;
    this._healthBarSettings = {
        width: this.healthBarLength,
        height: 20,
        position: {
            x: settings.scene.size.width - 143,
            y: 10,
        },
    };
    this._locationZ = 100;
    this.decreaseHealthBar = undefined;
    this._size = {
        width: 64,
        height: 64,
    };
    this.winner = settings.winnerName;
    this.loser = settings.loserName;

    this.createImageSessionResult = function () {
        k.loadSprite(this.winner, `sprites/${this.winner}.png`);
        k.loadSprite(this.loser, `sprites/${this.loser}.png`);
    };

    this.calculationHealthBarReduction = function (damage) {
        this.decreaseHealthBar = this.healthBarLength / damage;
    };

    this.createLayerSkull = function () {
        this._layerSkull = k.add([k.fixed(), k.z(this._locationZ)]);
    };

    this.createLayerIngredientScale = function () {
        this.layerIngredientScale = k.add([k.fixed(), k.z(this._locationZ)]);
    };

    this.createLayerBottlePoison = function () {
        this.layerBottlePoison = k.add([k.fixed(), k.z(this._locationZ)]);
    };

    this.displaySkull = function (color = this._color.natural) {
        this._layerSkull.add([
            k.sprite(this._skullName),
            k.scale(0.8),
            k.pos(k.width() - this._size.width * 3, -5),
            k.color(color),
        ]);
    };

    this.drawHealthBarBackground = function () {
        this._healthBarBackground = k.add([
            k.rect(this._healthBarSettings.width, this._healthBarSettings.height),
            k.pos(this._healthBarSettings.position.x, this._healthBarSettings.position.y),
            k.color(this._color.accent),
            k.z(this._locationZ),
        ]);
    };

    this.drawHealthBarForeground = function (lengthSegment) {
        this.healthBarForeground = k.add([
            k.rect(lengthSegment, this._healthBarSettings.height),
            k.pos(this._healthBarSettings.position.x, this._healthBarSettings.position.y),
            k.color(this._color.life),
            k.z(this._locationZ),
        ]);
    };

    this.createIngredientUI = function (recipe, ingredient, style) {
        style['size'] = 20;
        style['width'] = 200;
        style['align'] = 'left';
        let init = 30;
        let step = 0;
        for (const key of Object.keys(recipe)) {
            this.layerIngredientScale.add([k.sprite(key), k.scale(0.4), k.pos(10, init * step)]);

            const currentText = this.layerIngredientScale.add([
                k.pos(40, (init + 1.2) * step),
                k.text(`[gold]${ingredient[key]}/${recipe[key]}[/gold]`, style),
            ]);

            const tmp = {};
            tmp[key] = currentText;
            this._texts.push(tmp);

            ++step;
        }
    };

    this.refreshIngredientDisplay = function (ingredientName, collectedIngredients, recipe) {
        for (const item of this._texts) {
            if (Object.keys(item)[0] === ingredientName) {
                item[
                    ingredientName
                ].text = `[gold]${collectedIngredients[ingredientName]}/${recipe[ingredientName]}[/gold]`;
            }
        }
    };

    this.createSkull = function () {
        k.loadSprite(this._skullName, `sprites/${this._skullName}.png`);
    };

    this.createBottlePoison = function () {
        k.loadSprite(this._bottleName, `sprites/${this._bottleName}.png`);
    };

    this.displayBottlePoisons = function (style) {
        this.layerBottlePoison.add([k.sprite(this._bottleName), k.scale(0.8), k.pos(k.width() - 64 * 3, 50)]);
        this.layerBottlePoison.add([k.text('[gold]x[/gold]', style), k.pos(k.width() - 150, 70)]);
    };

    this.createCountingBottlePoisons = function (bottlePoison, maxBottles, style) {
        style['size'] = 30;
        this.bottlesCountText = this.layerBottlePoison.add([
            k.text(`[gold]${bottlePoison}/${maxBottles}[/gold]`, style),
            k.pos(k.width() - 135, 67),
        ]);
    };

    this.getSkull = function () {
        return this._layerSkull;
    };

    this.redrawSkull = function (color = this._color.natural) {
        k.destroy(this._layerSkull);
        this.createLayerSkull();
        this.displaySkull(color);
    };
}

function Recipe(k, settingsIngredientNames, settingsAmountIngredients) {
    this._ingredients = settingsIngredientNames;
    this._recipe = {};

    this.create = function () {
        for (const ingredient of this._ingredients) {
            this._recipe[ingredient] = k.randi(settingsAmountIngredients.min, settingsAmountIngredients.max + 1);
        }
    };

    this.getRecipe = function () {
        return this._recipe;
    };
}

function Notifier() {
    this.displayText = function (k, msg, style) {
        style['size'] = 60;
        style['width'] = 350;
        k.add([k.pos(250, 50), k.text(msg, style)]);
    };

    this.displayImage = function (k, imageName) {
        k.add([k.sprite(imageName), k.pos((k.width() - 256) / 2, 160), k.scale(4)]);
    };

    this.playOverText = function (k, keyChar, style) {
        style['size'] = 30;
        style['width'] = 700;
        k.add([
            k.pos(150, 450),
            k.text(`[gold]To start the game again. Press[/gold] [accent]${keyChar}[/accent]`, style),
        ]);
    };
}

function Bonus(k, settingsBonusName, settingsBonusSpawnTime) {
    this.tag = settingsBonusName;
    this.sprite = null;
    this.gameObject = null;
    this.numbersRandomPosition = {
        from: 64,
        to: 700,
    };
    this.spawnTime = settingsBonusSpawnTime;
    this.colliderSetting = {
        position: {
            x: 15,
            y: 15,
        },
        size: {
            width: 32,
            height: 30,
        },
    };
    this.isStatic = true;
    this.scale = 1;
    this.locationZ = 1;
    this.distanceToGround = 472;

    this.createSprite = function () {
        this.sprite = k.loadSprite(this.tag, `sprites/${this.tag}.png`);
    };

    this.spawn = function (provideData) {
        k.wait(this.spawnTime, () => {
            const numberRandomPositionX = k.randi(this.numbersRandomPosition.from, this.numbersRandomPosition.to + 1);
            const start = provideData.playerPositionRange.start;
            const end = provideData.playerPositionRange.end;
            const max = Math.max(start, end);
            const min = Math.min(start, end);

            const isRange = min <= numberRandomPositionX && numberRandomPositionX <= max;

            if (!isRange) {
                this.gameObject = k.add([
                    k.sprite(this.sprite),
                    k.area({
                        shape: new k.Rect(
                            k.vec2(this.colliderSetting.position.x, this.colliderSetting.position.y),
                            this.colliderSetting.size.width,
                            this.colliderSetting.size.height
                        ),
                    }),
                    k.body({ isStatic: this.isStatic }),
                    k.scale(this.scale),
                    k.z(this.locationZ),
                    k.pos(numberRandomPositionX, this.distanceToGround),
                    this.tag,
                    {
                        forename: this.tag,
                    },
                ]);

                this.gameObject.onCollide((other) => {
                    if (other.forename === provideData.playerName) {
                        k.destroy(this.gameObject);
                        this.spawn(provideData);
                    }
                });
            } else {
                this.spawn(provideData);
            }
        });
    };
}

function SpecialEffect(k, settings) {
    this.dustName = 'dust';
    this.starsName = 'star';
    this.vaporName = 'vapor';

    this.createDust = function (position, direction) {
        k.add([
            k.pos(position),
            k.rect(7, 7),
            k.color(settings.color.dust),
            k.anchor('center'),
            k.scale(k.rand(0.3, 0.6)),
            k.opacity(0.2),
            k.lifespan(0.2, { fade: 0.1 }),
            k.move(direction, k.rand(60, 120)),
            {
                forename: this.dustName,
            },
        ]);
    };

    this.createStart = function (position) {
        const directions = [k.LEFT, k.UP, k.RIGHT, k.DOWN, k.vec2(1, 1), k.vec2(-1, -1), k.vec2(1, -1), k.vec2(-1, 1)];
        for (let i = 0; i < directions.length; i++) {
            k.add([
                k.pos(position),
                k.rect(8, 8),
                k.color(settings.color.hit),
                k.anchor('center'),
                k.scale(k.rand(0.4, 0.6)),
                k.opacity(0.7),
                k.lifespan(0.2, { fade: 0.1 }),
                k.move(directions[i], k.rand(90, 100)),
                k.rotate(k.rand(-360, 360)),
                {
                    forename: this.starsName,
                },
            ]);
        }
    };

    this.repaint = function (heroGameObject) {
        heroGameObject.color = k.rgb(settings.color.sting);

        heroGameObject.wait(0.08, () => {
            heroGameObject.color = k.rgb(settings.color.natural);
        });
    };

    this.vaporPot = function (
        position,
        colors,
        numberBalls = 3,
        circleSize = { min: 3, max: 7 },
        scaleSize = { min: 0.4, max: 0.9 },
        life = { destroy: 0.1, fading: 0.2 },
        speed = { min: 150, max: 256 }
    ) {
        const posX = position.x;
        const posY = position.y;
        for (let i = 0; i < numberBalls; i++) {
            k.add([
                k.pos(k.rand(posX, posX + 20), posY),
                k.circle(k.rand(circleSize.min, circleSize.max)),
                k.color(k.choose(colors)),
                k.anchor('center'),
                k.scale(k.rand(scaleSize.min, scaleSize.max)),
                k.opacity(0.5),
                k.lifespan(life.destroy, { fade: life.fading }),
                k.move(k.UP, k.rand(speed.min, speed.max)),
                {
                    forename: this.vaporName,
                },
            ]);
        }
    };
}

function Enemy(k) {
    this.tag = 'enemy';
    this.sprite = null;
    this.gameObject = null;
    this.pointsSpawn = [-70, 850];
    this.speed = 220;
    this.dir = 1;
    this.currentPoint = undefined;

    this.createSprite = function () {
        this.sprite = k.loadSprite(this.tag, `sprites/${this.tag}.png`, {
            sliceX: 6,
            anims: {
                run: {
                    from: 0,
                    to: 5,
                    loop: true,
                    speed: 12,
                },
            },
        });
    };

    this.spawn = function () {
        this.currentPoint = this.pointsSpawn[k.randi(0, 2)];
        this.gameObject = k.add([
            k.sprite(this.sprite, { anim: 'run' }),
            k.pos(this.currentPoint, 473),
            k.area({ shape: new k.Rect(k.vec2(20, 44), 32, 20), collisionIgnore: ['ground', 'bonus'] }),
            k.offscreen({ hide: true, distance: 50 }),
            k.opacity(0),
            k.z(100),
            {
                forename: this.tag,
            },
        ]);
    };

    this.move = function () {
        const period = k.randi(4, 9);
        k.wait(period, () => {
            this.gameObject.opacity = 1;
            dir = this.currentPoint > 400 ? -1 : 1;
            this.gameObject.flipX = dir < 0 ? true : false;

            this.gameObject.onUpdate(() => {
                if (
                    (dir < 0 && Math.ceil(this.gameObject.pos.x) > Math.min(...this.pointsSpawn)) ||
                    (dir > 0 && Math.ceil(this.gameObject.pos.x) < Math.max(...this.pointsSpawn))
                ) {
                    this.gameObject.move(this.speed * dir, 0);
                } else {
                    this.gameObject.destroy();
                    this.spawn();
                    this.move();
                }
            });
        });
    };
}

function AudioEffect(zzfx) {
    this.playSound = function (sound) {
        zzfx(...sound);
    };
}

function Music(k) {
    this.melody = null;
    this.melodiesData = {
        bgmusic: null,
        winner: null,
        loser: null,
    };

    this.createMelodies = function () {
        for (key of Object.keys(this.melodiesData)) {
            this.melodiesData[key] = k.loadSound(key, `music/${key}.ogg`);
        }
    };

    this.playMelody = function (melodyData, loop) {
        this.melody = k.play(melodyData, { loop: loop });
    };
}

(function main() {
    const k = kaboom({
        width: settings.scene.size.width,
        height: settings.scene.size.height,
        canvas: document.getElementById(settings.scene.id),
        scale: settings.scene.scale,
        global: false,
        background: settings.color.fill,
        // maxFPS: 30,
    });
    k.debug.inspect = false; // DEBUG!

    const provideData = {
        textStyle: null,
        ground: undefined,
        ingredientDamage: undefined,
        bonusName: undefined,
        bonusSpawnTime: undefined,
        playerName: undefined,
        playerPositionRange: {
            start: 0,
            end: 0,
        },
        dustName: undefined,
        starName: undefined,
        enemyName: undefined,
    };

    const music = new Music(k);
    music.createMelodies();

    k.scene('start', () => {
        const start = new ScreenStart(k, settings);
        start.create();
        start.fontCreate();
        start.calculateTextPosition();
        start.calculatePicturePosition();
        const textStyle = start.getColorText();
        provideData.textStyle = textStyle;
        start.banner();
        start.textContinue(textStyle);
        start.control();
        start.descriptionControl();

        k.onKeyPress('enter', () => {
            k.go('main');
        });
    });
    k.go('start');

    k.scene('main', () => {
        music.playMelody(music.melodiesData.bgmusic, true);

        k.setGravity(settings.scene.gravity);
        k.onKeyPress('r', () => {
            k.go('main');
            music.melody.stop();
        });

        const audioEffect = new AudioEffect(zzfx);

        const poisonRecipe = new Recipe(k, settings.ingredientNames, settings.amountIngredients);
        poisonRecipe.create();
        let recipe = poisonRecipe.getRecipe();

        const specialEffect = new SpecialEffect(k, settings);
        provideData.dustName = specialEffect.dustName;
        provideData.starName = specialEffect.starsName;

        const enemy = new Enemy(k);
        enemy.createSprite();
        enemy.spawn();
        enemy.move();
        provideData.enemyName = enemy.tag;

        const bonus = new Bonus(k, settings.bonusName, settings.bonusSpawnTime);
        provideData.bonusName = bonus.tag;
        provideData.bonusSpawnTime = bonus.spawnTime;
        bonus.createSprite();
        bonus.spawn(provideData);

        const background = new Background(k);
        background.createSprite();
        background.create();

        const ingredient = new Ingredient(k, settings.ingredientNames);
        provideData.ingredientDamage = ingredient.damageHero;
        ingredient.createSprites();
        ingredient.spawn(settings.scene.frequencySpawn);

        const ground = new Ground(k);
        provideData.ground = ground.tag;
        ground.createSprite();
        ground.calculateSpan(settings.scene.size.width);
        ground.helperPlatform(settings.color.fill);
        ground.create(settings.scene.size.height);

        const userInterface = new UserInterface(k, settings);
        userInterface.createLayerIngredientScale();
        userInterface.createLayerBottlePoison();
        userInterface.createBottlePoison();
        userInterface.createSkull();
        userInterface.createLayerSkull();
        userInterface.displaySkull();
        userInterface.drawHealthBarBackground();
        const healthBarLength = userInterface.healthBarLength;
        userInterface.drawHealthBarForeground(healthBarLength);
        userInterface.calculationHealthBarReduction(provideData.ingredientDamage);
        userInterface.createImageSessionResult();

        (function playerHandler(ui, se, ae, mc) {
            const player = new Player(k, settings.color.natural);
            player.createSprite();
            const playerRestrictMove = player.calculateRestrict(settings.scene.size.width);
            player.calculateInitialPosition(settings.scene.size.width, settings.scene.size.height);
            provideData.playerName = player.tag;
            player.create();
            player.addPot([provideData.bonusName, provideData.playerName]);

            ui.createIngredientUI(recipe, player.gameObject.children[0].collectedIngredients, provideData.textStyle);
            ui.displayBottlePoisons(provideData.textStyle);
            ui.createCountingBottlePoisons(player.gameObject.bottlePoison, settings.maxBottles, provideData.textStyle);

            player.gameObject.children[0].onCollide((other) => {
                player.gameObject.children[0].collectedIngredients[other.forename] += 1;
                const state = player.makingPotions(recipe);
                player.gameObject.bottlePoison = state.potion;
                ui.refreshIngredientDisplay(other.forename, player.gameObject.children[0].collectedIngredients, recipe);
                const dir = player.gameObject.flipX ? k.vec2(40, 65) : k.vec2(75, 65);

                if (state['reboot']) {
                    k.destroy(ui.layerIngredientScale);
                    ui.createLayerIngredientScale();
                    ui.createIngredientUI(
                        recipe,
                        player.gameObject.children[0].collectedIngredients,
                        provideData.textStyle
                    );
                    se.vaporPot(
                        player.gameObject.pos.add(dir),
                        settings.colorFailure,
                        25,
                        { min: 5, max: 11 },
                        { min: 0.5, max: 0.8 },
                        { destroy: 0.3, fading: 0.2 },
                        { min: 150, max: 260 }
                    );
                    ae.playSound(settings.shortSounds.vapor);
                } else if (state['newRecipe']) {
                    k.destroy(ui.bottlesCountText);
                    ui.createCountingBottlePoisons(
                        player.gameObject.bottlePoison,
                        settings.maxBottles,
                        provideData.textStyle
                    );
                    poisonRecipe.create(k);
                    recipe = poisonRecipe.getRecipe();
                    k.destroy(ui.layerIngredientScale);
                    ui.createLayerIngredientScale(k);
                    ui.createIngredientUI(
                        recipe,
                        player.gameObject.children[0].collectedIngredients,
                        provideData.textStyle
                    );
                    se.vaporPot(
                        player.gameObject.pos.add(dir),
                        settings.colorLuck,
                        20,
                        { min: 10, max: 15 },
                        { min: 0.6, max: 0.9 },
                        { destroy: 0.8, fading: 0.6 },
                        { min: 150, max: 365 }
                    );

                    if (player.gameObject.bottlePoison === settings.maxBottles) {
                        mc.melody.stop();
                        k.go('inform', '[gold]You Winner[/gold]', ui.winner, mc, 'winner');
                    } else {
                        ae.playSound(settings.shortSounds.done);
                    }
                } else {
                    se.vaporPot(player.gameObject.pos.add(dir), [settings.color.life]);
                    ae.playSound(settings.shortSounds.pot);
                }
            });

            player.gameObject.onCollide((other) => {
                if (other.forename === provideData.bonusName) {
                    if (player.speed !== player.maxSpeed) {
                        ui.redrawSkull(settings.color.effect);
                        ae.playSound(settings.shortSounds.bonus);
                        const NumberDivisor = 2;
                        player.speed = player.maxSpeed;

                        player.gameObject.wait(provideData.bonusSpawnTime / NumberDivisor, () => {
                            ui.redrawSkull();
                            player.speed = player.speed / NumberDivisor;
                        });
                    }
                }

                if (
                    other.forename !== provideData.ground &&
                    other.forename !== provideData.bonusName &&
                    other.forename !== provideData.dustName &&
                    other.forename !== provideData.starName
                ) {
                    player.gameObject.hurt(provideData.ingredientDamage);
                    k.destroy(ui.healthBarForeground);
                    ui.drawHealthBarForeground((ui.healthBarLength -= ui.decreaseHealthBar));
                    if (ui.healthBarLength > 0) ae.playSound(settings.shortSounds.damage);

                    let position = k.vec2(88, 15);
                    if (!player.gameObject.flipX) position.x = position.x / 2;

                    if (other.forename !== provideData.enemyName) {
                        se.createStart(player.gameObject.pos.add(position));
                        se.repaint(player.gameObject);
                    } else {
                        se.repaint(player.gameObject);
                    }
                }
            });

            player.gameObject.onDeath(() => {
                mc.melody.stop();
                k.go('inform', '[accent]Game Over[/accent]', ui.loser, mc, 'loser');
            });

            player.gameObject.onKeyDown('left', () => {
                if (player.gameObject.pos.x > playerRestrictMove.left) {
                    provideData.playerPositionRange.start = Math.ceil(player.gameObject.pos.x) + 100;
                    provideData.playerPositionRange.end = Math.ceil(player.gameObject.pos.x) - 100;
                    player.gameObject.flipX = true;
                    player.gameObject.move(-player.speed, 0);
                    player.gameObject.area.shape.pos.x = player.turnColliderRelocation.left.parent;
                    player.gameObject.children[0].area.shape.pos.x = player.turnColliderRelocation.left.child;
                    if (player.gameObject.isGrounded()) {
                        se.createDust(player.gameObject.pos.add(87, k.rand(125, 130)), k.RIGHT);
                        se.createDust(player.gameObject.pos.add(100, k.rand(123, 129)), k.RIGHT);
                    }
                }
            });

            player.gameObject.onKeyDown('right', () => {
                player.gameObject.flipX = false;
                if (player.gameObject.pos.x < playerRestrictMove.right) {
                    provideData.playerPositionRange.start = Math.ceil(player.gameObject.pos.x) - 100;
                    provideData.playerPositionRange.end = Math.ceil(player.gameObject.pos.x) + 100;
                    player.gameObject.move(player.speed, 0);
                    player.gameObject.area.shape.pos.x = player.turnColliderRelocation.right.parent;
                    player.gameObject.children[0].area.shape.pos.x = player.turnColliderRelocation.right.child;
                    if (player.gameObject.isGrounded()) {
                        se.createDust(player.gameObject.pos.add(31, k.rand(125, 130)), k.LEFT);
                        se.createDust(player.gameObject.pos.add(40, k.rand(123, 129)), k.LEFT);
                    }
                }
            });

            player.gameObject.onKeyPress('space', () => {
                if (player.gameObject.isGrounded()) {
                    player.gameObject.jump();
                }
            });

            ['left', 'right', 'space'].forEach((key) => {
                if (key == 'space') {
                    player.gameObject.onKeyPress(key, () => {
                        player.gameObject.play('jump');
                    });
                } else if (key == 'right') {
                    player.gameObject.onKeyPress(key, () => {
                        player.gameObject.play('run');

                        if (player.turnCorrectionStatus[key]) {
                            player.gameObject.pos.x = player.gameObject.pos.x + player.gameObject.width;
                            player.turnStatusSwitch();
                        }
                    });
                } else if (key == 'left') {
                    player.gameObject.onKeyPress(key, () => {
                        player.gameObject.play('run');

                        if (player.turnCorrectionStatus[key]) {
                            player.gameObject.pos.x = player.gameObject.pos.x - player.gameObject.width;
                            player.turnStatusSwitch();
                        }
                    });
                }
            });

            player.gameObject.onKeyRelease(() => {
                if (!k.isKeyDown('left') && !k.isKeyDown('right') && !k.isKeyDown('space')) {
                    player.gameObject.play('idle');
                } else if (k.isKeyDown('right') || k.isKeyDown('left')) {
                    player.gameObject.play('run');
                } else if (k.isKeyDown('space') && player.gameObject.isGrounded()) {
                    player.gameObject.play('idle');
                }
            });

            player.gameObject.onUpdate(() => {
                if (
                    (k.isKeyDown('right') &&
                        k.isKeyDown('space') &&
                        player.gameObject.isGrounded() &&
                        player.gameObject.curAnim() !== 'run') ||
                    (k.isKeyDown('left') &&
                        k.isKeyDown('space') &&
                        player.gameObject.isGrounded() &&
                        player.gameObject.curAnim() !== 'run')
                ) {
                    player.gameObject.play('run');
                }

                if (
                    (player.gameObject.pos.x > playerRestrictMove.right && player.gameObject.curAnim() !== 'idle') ||
                    (player.gameObject.pos.x < playerRestrictMove.left && player.gameObject.curAnim() !== 'idle')
                ) {
                    player.gameObject.play('idle');
                }
            });
        })(userInterface, specialEffect, audioEffect, music);
    });

    k.scene('inform', (msg, img, mc, tg) => {
        mc.playMelody(mc.melodiesData[tg], false);
        k.onKeyPress('r', () => {
            mc.melody.stop();
            k.go('main');
        });
        const notifier = new Notifier();
        notifier.displayText(k, msg, provideData.textStyle);
        notifier.displayImage(k, img);
        notifier.playOverText(k, 'R', provideData.textStyle);
    });
})();
