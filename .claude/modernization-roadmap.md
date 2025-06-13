# 🚀 Jumping Dot Game モダン化ロードマップ

**作成者**: 妖狐の女の子「ねつき」⩌⩊⩌  
**作成日**: 2025年6月14日  
**目標**: 既存システムを最新ライブラリで置き換え + ステージエディタ実装

## 🎯 プロジェクト目標

### 主要成果物
1. **ビジュアルステージエディタ** - ドラッグ&ドロップでステージ作成
2. **高性能レンダリング** - Fabric.jsで描画パフォーマンス向上
3. **本格物理演算** - Matter.jsで正確な物理シミュレーション  
4. **豪華エフェクト** - tsParticlesで美しいアニメーション
5. **高速衝突判定** - detect-collisionsでパフォーマンス最適化

### 品質目標
- **コード削減**: 約360行削減 (60%減)
- **パフォーマンス**: 60fps安定動作
- **型安全性**: TypeScript厳格モード100%維持
- **テスト**: 全機能100%カバレッジ

---

## 📋 現状分析

### 既存システム構成
```
src/systems/
├── RenderSystem.ts      (333行) → Fabric.js
├── PhysicsSystem.ts     (40行)  → Matter.js  
├── AnimationSystem.ts   (145行) → tsParticles
├── CollisionSystem.ts   (89行)  → detect-collisions
└── その他システム       (維持)
```

### 依存関係マップ
```
Game.ts (コア)
├── RenderSystem    ← 多数の描画メソッド
├── PhysicsSystem   ← update()での物理計算
├── AnimationSystem ← エフェクト管理
└── CollisionSystem ← 衝突判定ロジック
```

### リスク評価
- **高リスク**: RenderSystem (複雑な描画ロジック)
- **中リスク**: PhysicsSystem (計算ロジック変更)
- **低リスク**: AnimationSystem, CollisionSystem (独立性高)

---

## 🗓️ 詳細実装スケジュール

### Phase 1: 基盤構築 + Fabric.js導入 (Day 1-3)

#### Day 1: 環境準備
```bash
# ライブラリインストール
npm install fabric @types/fabric
npm install matter-js @types/matter-js  
npm install tsparticles
npm install detect-collisions
```

**実装内容**:
1. `src/systems/FabricRenderSystem.ts` 作成
2. 基本的な図形描画 (Circle, Rect) 実装
3. 既存RenderSystemとのA/Bテスト環境構築

**期待成果**:
- 基本描画機能の動作確認
- パフォーマンス比較データ取得

#### Day 2: コア描画機能移行
**実装内容**:
1. プレイヤー描画の完全移行
2. プラットフォーム・スパイク描画実装
3. カメラ変換システム移行
4. 既存テストの書き換え

**期待成果**:
- 既存ゲーム機能100%再現
- 描画パフォーマンス向上確認

#### Day 3: ステージエディタ基盤
**実装内容**:
1. `src/editor/StageEditor.ts` 作成
2. エディタ/ゲームモード切り替え
3. 基本的なドラッグ&ドロップ実装
4. 要素パレット UI

**期待成果**:
- エディタの基本動作確認
- 要素配置・移動・削除機能

### Phase 2: ステージエディタ完成 (Day 4-6)

#### Day 4: 高度エディタ機能
**実装内容**:
1. `src/editor/ElementPalette.ts` 完成
2. アンドゥ/リドゥ機能
3. コピー&ペースト機能
4. プロパティ編集パネル

#### Day 5: データ管理システム
**実装内容**:
1. `src/utils/StageSerializer.ts` 作成
2. JSON保存・読み込み機能
3. ファイルダウンロード機能
4. ローカルストレージ連携

#### Day 6: エディタ統合テスト
**実装内容**:
1. エディタ用テストスイート作成
2. 作成ステージでのゲームプレイテスト
3. UI/UX調整
4. Phase 1完了・リリース準備

### Phase 3: Matter.js物理演算導入 (Day 7-8)

#### Day 7: 物理エンジン基盤
**実装内容**:
1. `src/systems/MatterPhysicsSystem.ts` 作成
2. 重力・跳躍・摩擦の実装
3. プラットフォーム衝突の基本動作
4. 既存PhysicsSystemとの比較テスト

#### Day 8: 物理演算完全移行
**実装内容**:
1. 高度な物理パラメータ調整
2. 既存ゲーム感覚の再現
3. PhysicsSystem完全置き換え
4. パフォーマンス最適化

### Phase 4: tsParticles導入 (Day 9-10)

#### Day 9: パーティクルシステム
**実装内容**:
1. `src/systems/TSParticleAnimationSystem.ts` 作成
2. クリア・デスエフェクト実装
3. 既存AnimationSystemとの比較

#### Day 10: エフェクト強化
**実装内容**:
1. より豪華なエフェクト追加
2. パフォーマンス最適化
3. AnimationSystem完全置き換え

### Phase 5: detect-collisions導入 (Day 11-12)

#### Day 11: 高速衝突判定
**実装内容**:
1. `src/systems/FastCollisionSystem.ts` 作成
2. 空間分割による高速化実装
3. 既存CollisionSystemとの比較

#### Day 12: 衝突判定完全移行
**実装内容**:
1. 全衝突パターンの実装
2. パフォーマンス測定・最適化
3. CollisionSystem完全置き換え

### Phase 6: 最終統合・テスト (Day 13-14)

#### Day 13: 統合テスト
**実装内容**:
1. 全システム統合動作確認
2. パフォーマンステスト
3. TypeScript型チェック確認
4. 全自動テスト実行

#### Day 14: 最終調整・リリース
**実装内容**:
1. UI/UX最終調整
2. ドキュメント更新
3. リリースノート作成
4. 本番デプロイ

---

## 🔧 技術的実装戦略

### 段階的移行パターン
```typescript
// 既存システムとの共存期間
class HybridRenderSystem {
  private fabricRenderer: FabricRenderSystem;
  private legacyRenderer: RenderSystem;
  private useFabric: boolean = false;

  render(gameState: GameState): void {
    if (this.useFabric) {
      this.fabricRenderer.render(gameState);
    } else {
      this.legacyRenderer.render(gameState);
    }
  }

  // 実行時切り替え可能
  enableFabricMode(): void {
    this.useFabric = true;
  }
}
```

### 型安全性確保
```typescript
// 既存型定義の拡張
interface FabricGameObject extends GameTypes.GameObject {
  fabricShape?: fabric.Object;
  matterBody?: Matter.Body;
}

// 厳格な型チェック維持
type ModernRenderSystem = FabricRenderSystem;
type ModernPhysicsSystem = MatterPhysicsSystem;
```

### テスト戦略
```typescript
// 既存テストとの互換性
describe('ModernRenderSystem', () => {
  it('should maintain compatibility with legacy behavior', () => {
    const modernSystem = new FabricRenderSystem(canvas);
    const legacySystem = new RenderSystem(canvas);
    
    // 同じ結果を出力することを確認
    expect(modernSystem.renderPlayer(player))
      .toEqual(legacySystem.renderPlayer(player));
  });
});
```

---

## 📊 品質管理・指標

### パフォーマンス指標
- **FPS**: 60fps以上維持
- **メモリ使用量**: 現在比20%以下削減
- **初期化時間**: 1秒以内
- **ステージロード時間**: 500ms以内

### 品質指標  
- **TypeScriptエラー**: 0個維持
- **テストカバレッジ**: 95%以上
- **ビルド時間**: 30秒以内
- **バンドルサイズ**: 現在比10%増以内

### ユーザビリティ指標
- **エディタ学習時間**: 5分以内でステージ作成可能
- **エディタ操作性**: ドラッグ&ドロップ遅延なし
- **ステージ共有**: JSON形式で簡単共有

---

## ⚠️ リスク管理・対策

### 高リスク事項
1. **Fabric.js学習コスト**
   - 対策: 段階的導入、既存システム並行運用
   
2. **Matter.js物理感覚変化**
   - 対策: パラメータ調整期間確保、A/Bテスト

3. **バンドルサイズ増加**
   - 対策: Tree-shaking、Code splitting適用

### 緊急時対応
- **ロールバック計画**: 各Phase完了時にタグ作成
- **既存システム保持**: 完全移行まで削除禁止
- **段階的リリース**: ユーザーフィードバック収集

---

## 🎉 期待効果・成果

### 技術的成果
- **コードベース**: 4000行 → 3640行 (360行削減)
- **保守性**: ライブラリ活用で大幅向上
- **拡張性**: エディタ機能でコンテンツ無限拡張
- **パフォーマンス**: レンダリング・物理演算高速化

### ユーザー体験向上
- **ステージエディタ**: ユーザー生成コンテンツ
- **美しいエフェクト**: ゲーム体験向上  
- **滑らかな動作**: 高性能物理演算
- **コミュニティ**: ステージ共有文化

### 開発者体験向上
- **実装効率**: ライブラリ活用で開発速度向上
- **デバッグ**: 成熟ライブラリで問題解決容易
- **学習**: モダンな技術スタック経験
- **拡張**: 新機能追加が容易

---

**ねつきからお兄ちゃんへ**: 段階的に進めるから安心して♪ 何か問題があったらすぐ教えてね〜⩌⩊⩌

**最終更新**: 2025年6月14日  
**ステータス**: 実装開始準備完了✨  
**推定期間**: 14日間（2週間）