# 🦊 ねつき式ライブラリ統合ガイド

**作成者**: 妖狐の女の子「ねつき」⩌⩊⩌  
**作成日**: 2025年6月14日  
**目的**: Web検索なしで各ライブラリを使えるように！

## 📋 選定ライブラリ一覧

| ライブラリ | 用途 | 置き換え対象 | 削減見込み |
|------------|------|-------------|-----------|
| **Fabric.js** | Canvas操作・エディタ | RenderSystem | ~200行 |
| **Matter.js** | 物理演算 | PhysicsSystem | 全置換 |
| **tsParticles** | パーティクル | AnimationSystem | ~100行 |
| **detect-collisions** | 衝突判定 | CollisionSystem | ~60行 |

**総削減見込み**: 約360行 (60%削減) + 高性能化 ⚡

---

## 🎨 Fabric.js - Canvas操作・エディタ

### 📦 インストール・基本設定
```bash
npm install fabric
```

```typescript
import { fabric } from 'fabric';

// Canvas初期化
const canvas = new fabric.Canvas('canvas-id', {
  width: 800,
  height: 600,
  backgroundColor: 'black'
});
```

### 🎯 Jumping Dot Game用基本パターン

#### プレイヤー描画
```typescript
// 現在のrenderPlayer置き換え
class FabricRenderSystem {
  private canvas: fabric.Canvas;
  private playerShape: fabric.Circle | null = null;

  renderPlayer(player: Player): void {
    if (this.playerShape) {
      // 位置更新のみ
      this.playerShape.set({ left: player.x, top: player.y });
    } else {
      // 初回作成
      this.playerShape = new fabric.Circle({
        left: player.x,
        top: player.y,
        radius: player.radius,
        fill: 'white',
        selectable: false // ゲーム中は選択無効
      });
      this.canvas.add(this.playerShape);
    }
    this.canvas.renderAll();
  }
}
```

#### プラットフォーム描画
```typescript
renderPlatform(platform: Platform): fabric.Rect {
  return new fabric.Rect({
    left: platform.x1,
    top: platform.y1,
    width: platform.x2 - platform.x1,
    height: platform.y2 - platform.y1,
    fill: 'brown',
    stroke: 'white',
    strokeWidth: 2,
    selectable: true // エディタモードで選択可能
  });
}
```

#### カメラ変換
```typescript
applyCameraTransform(camera: Camera): void {
  // Fabric.jsのviewport変換
  this.canvas.setViewportTransform([
    1, 0, 0, 1, -camera.x, -camera.y
  ]);
}
```

### 🛠️ ステージエディタ用機能

#### ドラッグ&ドロップ
```typescript
// エディタモード設定
enableEditorMode(): void {
  this.canvas.selection = true;
  this.canvas.forEachObject(obj => {
    obj.selectable = true;
    obj.evented = true;
  });
}

// パレットからの要素追加
addPlatformFromPalette(x: number, y: number): void {
  const platform = new fabric.Rect({
    left: x,
    top: y,
    width: 100,
    height: 20,
    fill: 'brown',
    stroke: 'white',
    strokeWidth: 2
  });
  
  this.canvas.add(platform);
  this.canvas.setActiveObject(platform);
}
```

#### JSON保存・読み込み
```typescript
// ステージ保存
saveStage(): string {
  return JSON.stringify(this.canvas.toJSON(['stageType', 'gameData']));
}

// ステージ読み込み
loadStage(jsonData: string): void {
  this.canvas.loadFromJSON(jsonData, () => {
    this.canvas.renderAll();
  });
}
```

### ⚠️ 注意点・ベストプラクティス
- **パフォーマンス**: 大量オブジェクトは`renderOnAddRemove: false`使用
- **イベント**: ゲーム中は`selectable: false`でパフォーマンス向上
- **メモリ**: 不要オブジェクトは`canvas.remove(obj)`で削除

---

## ⚗️ Matter.js - 物理演算エンジン

### 📦 インストール・基本設定
```bash
npm install matter-js
npm install @types/matter-js
```

```typescript
import { Engine, World, Bodies, Body, Events } from 'matter-js';

// エンジン初期化
const engine = Engine.create();
engine.world.gravity.y = 0.8; // 重力設定
```

### 🎯 Jumping Dot Game用基本パターン

#### プレイヤー作成
```typescript
class MatterPhysicsSystem {
  private engine: Engine;
  private playerBody: Body;

  createPlayer(x: number, y: number, radius: number): Body {
    this.playerBody = Bodies.circle(x, y, radius, {
      frictionAir: 0.01,
      restitution: 0.1, // 跳ね返り係数
      label: 'player'
    });
    
    World.add(this.engine.world, this.playerBody);
    return this.playerBody;
  }

  // 現在のPhysicsSystem.update()置き換え
  update(deltaTime: number): void {
    Engine.update(this.engine, deltaTime);
  }
}
```

#### プラットフォーム作成
```typescript
createPlatform(platform: Platform): Body {
  const platformBody = Bodies.rectangle(
    (platform.x1 + platform.x2) / 2, // 中心X
    (platform.y1 + platform.y2) / 2, // 中心Y
    platform.x2 - platform.x1,       // 幅
    platform.y2 - platform.y1,       // 高さ
    { 
      isStatic: true,  // 動かない
      label: 'platform'
    }
  );
  
  World.add(this.engine.world, platformBody);
  return platformBody;
}
```

#### プレイヤー操作
```typescript
// ジャンプ
jump(): void {
  if (this.isPlayerGrounded()) {
    Body.applyForce(this.playerBody, this.playerBody.position, {
      x: 0, y: -0.3
    });
  }
}

// 左右移動
movePlayer(direction: number): void {
  Body.applyForce(this.playerBody, this.playerBody.position, {
    x: direction * 0.01, y: 0
  });
}
```

#### 衝突判定
```typescript
setupCollisionEvents(): void {
  Events.on(this.engine, 'collisionStart', (event) => {
    event.pairs.forEach((pair) => {
      const { bodyA, bodyB } = pair;
      
      if (bodyA.label === 'player' && bodyB.label === 'platform') {
        this.handlePlatformLanding(bodyA, bodyB);
      }
    });
  });
}
```

### ⚠️ 注意点・ベストプラクティス
- **スケール**: Matter.jsは現実的な単位、適切なスケール調整必要
- **パフォーマンス**: 不要なBodyは`World.remove()`で削除
- **デバッグ**: `Render.create()`でデバッグ描画可能

---

## ✨ tsParticles - パーティクルシステム

### 📦 インストール・基本設定
```bash
npm install tsparticles
```

```typescript
import { tsParticles } from 'tsparticles';

// 初期化
await tsParticles.load('particles-container', particleConfig);
```

### 🎯 Jumping Dot Game用基本パターン

#### クリアエフェクト
```typescript
const clearEffectConfig = {
  particles: {
    number: { value: 50 },
    color: { value: '#ffffff' },
    shape: { type: 'circle' },
    size: { value: 3, random: true },
    move: {
      enable: true,
      speed: 6,
      direction: 'none',
      random: true,
      straight: false,
      outModes: { default: 'out' }
    },
    life: {
      duration: { value: 3 }
    }
  },
  background: { color: { value: 'transparent' } }
};

// クリア時実行
async showClearEffect(x: number, y: number): Promise<void> {
  const config = {
    ...clearEffectConfig,
    particles: {
      ...clearEffectConfig.particles,
      position: { x, y }
    }
  };
  
  await tsParticles.load('clear-effect', config);
}
```

#### デスエフェクト
```typescript
const deathEffectConfig = {
  particles: {
    number: { value: 30 },
    color: { value: '#ff0000' },
    shape: { type: 'triangle' },
    size: { value: 2, random: true },
    move: {
      enable: true,
      speed: 4,
      direction: 'top',
      random: false,
      straight: true
    },
    life: {
      duration: { value: 2 }
    }
  }
};
```

#### 既存AnimationSystemとの統合
```typescript
class TSParticleAnimationSystem {
  async startClearAnimation(player: Player): Promise<void> {
    // 既存コードの置き換え
    await this.showClearEffect(player.x, player.y);
  }

  async startDeathAnimation(player: Player): Promise<void> {
    await this.showDeathEffect(player.x, player.y);
  }

  // パーティクル停止
  stopAllEffects(): void {
    tsParticles.destroy();
  }
}
```

### ⚠️ 注意点・ベストプラクティス
- **パフォーマンス**: パーティクル数を適切に調整
- **メモリ**: エフェクト終了後は`tsParticles.destroy()`
- **カスタム**: 独自シェイプやアニメーション可能

---

## 💥 detect-collisions - 高速衝突判定

### 📦 インストール・基本設定
```bash
npm install detect-collisions
```

```typescript
import { Collisions, Circle, Box } from 'detect-collisions';

// システム初期化
const collisionSystem = new Collisions();
```

### 🎯 Jumping Dot Game用基本パターン

#### Body作成・管理
```typescript
class FastCollisionSystem {
  private system: Collisions;
  private playerBody: Circle;
  private platformBodies: Box[] = [];

  constructor() {
    this.system = new Collisions();
  }

  createPlayerBody(player: Player): Circle {
    this.playerBody = new Circle(player.x, player.y, player.radius);
    this.playerBody.body = 'player'; // ラベル設定
    this.system.insert(this.playerBody);
    return this.playerBody;
  }

  createPlatformBody(platform: Platform): Box {
    const body = new Box(
      platform.x1, platform.y1,
      platform.x2 - platform.x1, platform.y2 - platform.y1
    );
    body.body = 'platform';
    this.platformBodies.push(body);
    this.system.insert(body);
    return body;
  }
}
```

#### 衝突判定実行
```typescript
// 既存CollisionSystem.handlePlatformCollisions()置き換え
checkCollisions(): boolean {
  // 位置更新
  this.playerBody.x = this.player.x;
  this.playerBody.y = this.player.y;
  this.system.update();

  // 衝突チェック
  const potentials = this.playerBody.potentials();
  
  for (const contact of potentials) {
    if (contact.body === 'platform') {
      this.handlePlatformCollision(contact);
      return true;
    }
  }
  return false;
}

// 高速範囲検索
getNearbyObjects(x: number, y: number, radius: number): any[] {
  const queryCircle = new Circle(x, y, radius);
  return queryCircle.potentials();
}
```

### ⚠️ 注意点・ベストプラクティス
- **更新**: 位置変更後は`system.update()`必須
- **パフォーマンス**: 不要Bodyは`system.remove()`で削除
- **空間分割**: 自動でBVH(空間分割)適用済み

---

## 🚀 統合実装プラン

### Phase 1: Fabric.js + ステージエディタ
1. Fabric.js導入
2. 基本描画をFabric.jsに移行
3. エディタUI実装
4. JSON保存・読み込み

### Phase 2: Matter.js + 物理演算
1. Matter.js導入  
2. PhysicsSystemをMatter.jsに置き換え
3. より正確な物理演算

### Phase 3: tsParticles + エフェクト
1. tsParticles導入
2. AnimationSystemを置き換え
3. より豪華なエフェクト

### Phase 4: detect-collisions + 高速化
1. detect-collisions導入
2. CollisionSystemを置き換え
3. パフォーマンス向上

## 📚 参考資料・リンク

- **Fabric.js**: https://fabricjs.com/
- **Matter.js**: https://brm.io/matter-js/
- **tsParticles**: https://particles.js.org/
- **detect-collisions**: https://www.npmjs.com/package/detect-collisions

---

**ねつきのアドバイス**: 一度に全部変えず、段階的に♪ テストしながら進めてね〜⩌⩊⩌

**最終更新**: 2025年6月14日  
**ステータス**: 実装準備完了✨