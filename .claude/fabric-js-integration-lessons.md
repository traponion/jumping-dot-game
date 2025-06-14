# Fabric.js統合の知見とノウハウ

## 概要
この資料は、レガシーCanvas APIからFabric.jsへの移行作業で得られた重要な知見をまとめたものです。
次のねつきや開発者が同様の作業を行う際の参考にしてください。

## 🎯 プロジェクト背景
- **目的**: RenderSystemをFabric.jsベースのFabricRenderSystemに置き換え
- **要件**: 既存の動作・見た目を完全に再現
- **手法**: ハイブリッド実装でスムーズな移行

## 🔧 主要な技術課題と解決策

### 1. Canvas要素の二重化問題

**問題**: Fabric.jsは自動的にlower-canvasとupper-canvasの2層構造を作成する
- upper-canvas: インタラクション用（選択、コントロールなど）
- lower-canvas: 実際の描画内容

**症状**: ゲーム画面が表示されない

**解決策**:
```typescript
// upper-canvasの背景を透明に設定
const upperCanvas = this.canvas.upperCanvasEl;
if (upperCanvas) {
    upperCanvas.style.backgroundColor = 'transparent';
}
```

### 2. ランディング予測システムの実装

**課題**: レガシー版の複雑なアニメーションシステムを再現

**重要なコンポーネント**:
- `landingPredictions`: 予測データ
- `animatedPredictions`: アニメーション状態
- `LERP_SPEED`: 補間速度（0.1）
- `drawCrosshair()`: 十字マーカー描画

**実装ポイント**:
```typescript
// アニメーション更新
for (const animPred of this.animatedPredictions) {
    animPred.x += (animPred.targetX - animPred.x) * this.LERP_SPEED;
    animPred.y += (animPred.targetY - animPred.y) * this.LERP_SPEED;
}
```

### 3. プラットフォーム描画の違い

**レガシー**: ライン描画 (x1,y1) → (x2,y2)
**最初のFabric.js実装**: Rect描画（誤り）

**修正**:
```typescript
// ❌ 間違った実装
new fabric.Rect({ ... })

// ✅ 正しい実装
new fabric.Line([platform.x1, platform.y1, platform.x2, platform.y2], {
    stroke: 'white',
    strokeWidth: 2
})
```

### 4. パーティクルサイズの計算違い

**レガシー**: `particle.size || 2` をそのまま半径として使用
**最初のFabric.js実装**: `size / 2` として半径計算（誤り）

**修正**:
```typescript
// ✅ 正しい実装
const radius = particle.size || 2;
new fabric.Circle({
    radius: radius,  // そのまま使用
    left: particle.x - radius,
    top: particle.y - radius
})
```

### 5. 着地履歴の見た目の違い

**レガシー**: 白い縦線（8px高）、透明度0.6→0.1
**最初のFabric.js実装**: 黄色い円、透明度1.0→0（誤り）

**修正**:
```typescript
// ✅ 正しい実装
const fadeProgress = age / HISTORY_FADE_TIME;
const alpha = Math.max(0.1, 0.6 * (1 - fadeProgress));

new fabric.Line([
    history.x, history.y,
    history.x, history.y - 8
], {
    stroke: `rgba(255, 255, 255, ${alpha})`,
    strokeWidth: 1
})
```

## 🎨 UI要素とカメラ変換の課題

### 問題
Fabric.jsの`setViewportTransform`は全オブジェクトに適用される。
レガシーCanvas APIでは`save()`/`restore()`でUI要素をカメラ変換から除外できたが、Fabric.jsでは困難。

### 現在の状況
- ゲームワールド要素: カメラ変換適用（正しい）
- UI要素（ゲームオーバー、開始画面）: カメラ変換適用（問題）

### 解決策案
1. **UI要素を外部HTML/CSSで実装**（推奨）
2. Fabric.jsオブジェクトを動的に画面座標に再配置
3. 複数Canvasの使用

## 📚 重要な学習ポイント

### Fabric.js特有の概念
- **Object-based rendering**: 個別オブジェクトの管理
- **Viewport transformation**: グローバルな座標変換
- **Selection system**: インタラクション管理
- **Event system**: オブジェクト単位のイベント

### パフォーマンス考慮事項
- **renderOnAddRemove: false**: 自動再描画の無効化
- **selection: false**: 選択機能の無効化（ゲームモード）
- **interactive: false**: インタラクション無効化
- オブジェクト数の制限（トレイル、パーティクルなど）

### 型安全性
```typescript
// パーティクルのサイズプロパティは optional
const size = particle.size || 2;

// Fabric.jsオブジェクトの型定義を正確に
private platformShapes: fabric.Line[] = [];
```

## 🛠️ 実装パターン

### 1. オブジェクト管理パターン
```typescript
// 既存オブジェクトを削除してから新規作成
this.existingShapes.forEach(shape => this.canvas.remove(shape));
this.existingShapes = [];

// 新しいオブジェクトを作成・追加
const newShape = new fabric.Circle({...});
this.existingShapes.push(newShape);
this.canvas.add(newShape);
```

### 2. アニメーション更新パターン
```typescript
// 既存オブジェクトの位置更新
if (this.existingShape) {
    this.existingShape.set({
        left: newX,
        top: newY
    });
} else {
    // 新規作成
    this.existingShape = new fabric.Circle({...});
    this.canvas.add(this.existingShape);
}
```

### 3. メモリリーク防止
```typescript
dispose(): void {
    this.canvas.dispose();
    // 明示的にオブジェクト参照をクリア
    this.playerShape = null;
    this.platformShapes = [];
}
```

## ⚠️ よくある落とし穴

1. **upper-canvasの背景色**: 透明に設定しないと下層が見えない
2. **originX/originY**: テキストの位置指定でcenterを忘れがち
3. **strokeWidth vs lineWidth**: Fabric.jsではstrokeWidth
4. **座標系の違い**: Fabric.jsはleft/topが基準
5. **パフォーマンス**: renderAll()の呼び忘れ

## 🔄 移行チェックリスト

- [ ] 視覚的な完全一致確認
- [ ] パフォーマンス比較
- [ ] インタラクション動作確認
- [ ] メモリリーク検証
- [ ] エラーハンドリング
- [ ] 型安全性確認

## 📝 次回への改善提案

1. **段階的移行**: 一度に全機能を移行せず、機能単位で実施
2. **自動テスト**: 視覚的回帰テストの導入
3. **パフォーマンス計測**: 移行前後の性能比較
4. **ドキュメント**: 設計決定の根拠を詳細に記録

---

**作成者**: ねつき  
**作成日**: 2025年6月14日  
**最終更新**: 復元作業完了時