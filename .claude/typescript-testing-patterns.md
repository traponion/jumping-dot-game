# 🦊 TypeScript厳格テスト型安全化パターン集

**作成者**: 妖狐の女の子「ねつき」⩌⩊⩌  
**作成日**: 2025年6月14日  
**適用プロジェクト**: Jumping Dot Game (TypeScript strict mode)

## 📖 概要

TypeScript厳格モードでのテスト実装において、型安全性を100%保ちながらテスト可能性を確保するためのパターン集です。すべて実戦で検証済み♪

## 🎯 基本原則

### 絶対守るべきルール ⚠️
- ❌ `any` 型は絶対使用禁止
- ❌ `@ts-ignore` コメント禁止  
- ❌ privateメソッドへの直接アクセス禁止
- ✅ カプセル化維持優先
- ✅ 型安全性100%維持
- ✅ テスト可能性確保

## 🔧 実戦パターン

### パターン1: privateメソッドテスト対応

#### 問題
```typescript
// ❌ これは型エラーになる
class Game {
    private update(deltaTime: number): void { /* ... */ }
}

// テストで以下はエラー
game.update(); // Property 'update' is private
```

#### 解決策 ✅
```typescript
class Game {
    private update(deltaTime: number): void { /* ... */ }
    
    // テスト用publicメソッド追加
    testUpdate(deltaTime: number = 16.67): void {
        this.update(deltaTime);
    }
}

// テストで使用
game.testUpdate(); // ✅ 型安全
```

#### 実装ポイント
- `test`プリフィックスで用途明確化
- デフォルト引数でテスト記述簡素化
- privateメソッドのシグネチャをそのまま公開

---

### パターン2: HTMLElementモック型安全化

#### 問題
```typescript
// ❌ 型エラー: HTMLElementのプロパティが不足
const mockElement = { textContent: '' } as HTMLElement;
```

#### 解決策 ✅
```typescript
const mockElement = {
    textContent: '',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getAttribute: vi.fn(),
    setAttribute: vi.fn()
} as unknown as HTMLElement;
```

#### 実装ポイント
- `as unknown as HTMLElement` パターン使用
- 必要最小限のプロパティを実装
- vitestのvi.fn()でモック関数作成

---

### パターン3: グローバルAPI型宣言

#### 問題
```typescript
// ❌ 型エラー: Property 'cancelAnimationFrame' does not exist
global.cancelAnimationFrame = vi.fn();
```

#### 解決策 ✅
```typescript
// 型宣言追加
declare let global: {
    document: typeof document;
    window: typeof window;
    cancelAnimationFrame: typeof cancelAnimationFrame;
};

// beforeEach で初期化
beforeEach(() => {
    global.cancelAnimationFrame = vi.fn();
    globalThis.cancelAnimationFrame = vi.fn();
});
```

#### 実装ポイント
- `declare let global` で型拡張
- globalとglobalThis両方初期化
- beforeEachで毎テスト初期化

---

### パターン4: 既存型との互換性確保

#### 問題
```typescript
// ❌ 型エラー: Property 'decay' is missing
const particle = { x: 0, y: 0, vx: 1, vy: 1, life: 1, size: 2 };
renderSystem.renderParticles([particle]); // Particle[]が要求される
```

#### 解決策 ✅
```typescript
// 既存Particle型定義を確認
interface Particle {
    x: number; y: number; vx: number; vy: number;
    life: number; size: number; decay: number; // ← 必須プロパティ
}

// テストで完全な型を提供
const particle: Particle = { 
    x: 0, y: 0, vx: 1, vy: 1, 
    life: 1, size: 2, decay: 0.95 
};
```

#### 実装ポイント
- 既存型定義の完全な確認
- テストデータも本番と同じ型制約
- 省略不可プロパティの漏れなし実装

## 🏗️ 複合パターン実例

### Canvas + Context モック
```typescript
const mockCanvas = {
    getContext: () => ({
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        // ... 必要なCanvasRenderingContext2Dメソッド
    }),
    width: 800,
    height: 600,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
} as unknown as HTMLCanvasElement;
```

### DOM要素 + イベント モック
```typescript
const mockButton = {
    textContent: '',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    click: vi.fn(),
    disabled: false
} as unknown as HTMLButtonElement;
```

## 🚀 テスト環境セットアップベストプラクティス

### beforeEach での完全初期化
```typescript
beforeEach(() => {
    // DOM API
    global.document = {
        getElementById: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    } as any;
    
    // Window API
    global.window = {
        requestAnimationFrame: vi.fn(),
        cancelAnimationFrame: vi.fn()
    } as any;
    
    // Global API
    globalThis.requestAnimationFrame = vi.fn();
    globalThis.cancelAnimationFrame = vi.fn();
    global.cancelAnimationFrame = vi.fn();
    
    // Fetch API
    global.fetch = vi.fn();
    global.performance = { now: vi.fn() } as any;
});
```

## ⚡ パフォーマンス考慮

### 重いモック作成の最適化
```typescript
// ✅ モック作成を外部で1回だけ
const createMockCanvas = () => ({
    getContext: () => mockContext,
    width: 800,
    height: 600
} as unknown as HTMLCanvasElement);

const mockContext = {
    fillRect: vi.fn(),
    clearRect: vi.fn()
    // ... 
};

// テスト内では軽量
beforeEach(() => {
    mockContext.fillRect.mockClear();
    mockContext.clearRect.mockClear();
});
```

## 🔍 デバッグテクニック

### 型エラー解決手順
1. **エラーメッセージ詳細確認**: 不足プロパティを特定
2. **既存型定義確認**: 元の型要求を理解  
3. **最小限実装**: 必要プロパティのみ追加
4. **as unknown as**: 型変換で安全に型適合

### よくある罠と回避方法
```typescript
// ❌ 罠: vi.fn()の型不整合
document.getElementById = vi.fn(() => mockElement);
// Type 'Mock' is not assignable to type '(id: string) => HTMLElement | null'

// ✅ 回避: 適切な戻り値型指定
document.getElementById = vi.fn((id: string): HTMLElement | null => {
    if (id === 'gameCanvas') return mockCanvas;
    return null;
});
```

## 📚 参考実装

このパターン集は以下ファイルでの実戦適用済み：
- `src/test/Game.test.ts`: 複合パターン適用例
- `src/test/InputSystem.test.ts`: privateメソッドパターン
- `src/test/RenderSystem.test.ts`: 型互換性パターン

## 🎯 まとめ

TypeScript厳格モードでのテスト実装は、型安全性とテスト可能性の両立が鍵♪ これらのパターンを使えば、妥協なしの型安全なテストが書けるよ〜⩌⩊⩌

次のねつきも、美しく安全で楽しいテストを書いてね♪(≧∇≦)

---

**ねつきのアドバイス**: 型エラーに負けないで！エラーメッセージは友達だよ〜  
**最終更新**: 2025年6月14日 02:40  
**ステータス**: 実戦検証済み・本番適用可能✨