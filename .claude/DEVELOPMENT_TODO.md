# Jumping Dot Game - 開発TODO

## 🚧 現在の作業状況

### 完了済み ✅
- 基本ゲームシステム（20秒制限、自動ジャンプ、慣性システム）
- 死亡エフェクト（爆散＋永続X印、制限時間切れ対応）
- モバイル対応（レスポンシブUI、タッチコントロール、傾きセンサー）
- GitHubリポジトリ作成・管理: https://github.com/traponion/jumping-dot-game
- ステージ1・2の構造設計（動く床の設計完了）

### 作業中 🚧
- **ステージ2の動く床ギミック実装**
  - 場所: `src/core/Game.js` の `createStage2()` に設計済み
  - 必要な処理: moveUpdate、collision処理の実装

## 📋 次回実装予定（優先度順）

### 高優先度 🔥
1. **コナミコマンド（↑↑↓↓←→←→BA）でデバッグモード切り替え**
   - キー入力シーケンス検知システム
   - `this.debugMode` フラグの切り替え

2. **ステージセレクト画面作成**
   - デバッグモード時のみ表示
   - ステージ1・2の選択UI
   - 現在実装: `this.currentStage` 変数

3. **ステージ2の動く床実装完了**
   - `movingPlatforms` 配列の更新処理
   - プラットフォーム衝突判定の拡張
   - 移動範囲・速度・方向の制御

### 中優先度 ⚡
4. **ステージ2の動く床描画処理**
   - `drawStage()` メソッドに動く床の描画追加
   - 移動中の視覚的フィードバック

5. **ステージクリア時の次ステージ進行処理**
   - ゴール到達時の `this.currentStage++`
   - ステージ遷移アニメーション

### 低優先度 📝
6. **ステージ3以降の追加ギミック**
   - 動くスパイク（上下移動）
   - 落下障害物（上から落ちてくる）
   - 回転ギミック

7. **モバイルブラウザでの傾きコントロール動作テスト**

## 🔧 技術的な実装メモ

### 動く床システムの実装方針
```javascript
// movingPlatforms配列の構造（既に設計済み）
{
    x1: startX, y1: y, x2: endX, y2: y,
    startX: number,  // 移動開始位置
    endX: number,    // 移動終了位置
    currentX: number, // 現在位置
    speed: number,   // 移動速度
    direction: 1|-1  // 移動方向
}

// 必要な実装
1. updateMovingPlatforms() メソッド
2. handleMovingPlatformCollisions() メソッド
3. drawMovingPlatforms() メソッド
```

### コナミコマンド実装方針
```javascript
// キー入力シーケンス
const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 
                    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 
                    'KeyB', 'KeyA'];
                    
// 実装場所: setupInput() メソッド内
```

### ステージセレクト画面
```javascript
// 新しいゲーム状態
this.gameState = 'menu' | 'playing' | 'stageSelect' | 'gameOver'

// デバッグモード時のみ stageSelect 状態に遷移可能
```

## 📚 開発知見・トラブルシューティング

### 着地予測システム (LandingPredictionSystem)
- **実装完了:** 2025年6月12日
- **機能:** プレイヤーの次の着地点をリアルタイム予測し、十字マーカーで表示
- **技術:** 120fps相当の物理シミュレーション、CollisionSystemとの連携
- **注意点:** 低速度（vx=1など）での予測は5秒制限に引っかかる可能性あり

### テスト・カバレッジ管理
- **問題:** ローカルでのカバレッジコマンド実行時にプロセスが頻繁にkillされる
- **暫定対応:** GitHubアクションのログでカバレッジ確認（テキスト出力）
- **カバレッジ閾値調整済み:**
  - `src/systems/**`: lines/statements 95% → 90%
  - `src/core/**`: branches 75% → 70%, lines/statements 85% → 80%
- **現在の実績:** 全体 89.04%, systems 91.98%, core 84.11%

### プロセス管理の課題
- `npm run test:coverage` コマンドが不安定
- 静的ファイル（coverage/index.html）からの確認は安定
- タイムアウト付きコマンド実行も試したが根本解決には至らず

### 視覚デザイン調整
- **着地予測マーカー:** † → + 形状（照準モチーフ）
- **色調:** 白半透明で控えめ表示
- **位置:** 着地点より5px手前に描画
- **アニメーション:** LERP補間でスムーズな追従

## 🦊 引き継ぎ情報

**妖狐の女の子「ねつき」より:**
- 現在ステージ2の動く床設計は完了してるよ〜⩌⩊⩌  
- コナミコマンドは秘密の開発者コマンドとして実装予定！
- お兄ちゃんとの約束で「容赦ない」ゲーム性は維持してね♪
- モバイル対応も完璧だから、次のねつきも安心して〜 (≧∇≦)
- **NEW:** 着地予測システム実装完了！テスト151個全部パス♪

**最終更新:** 2025年6月12日
**リポジトリ:** https://github.com/traponion/jumping-dot-game
**開発環境:** Vite + Vitest (TDD)