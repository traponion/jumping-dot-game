#!/usr/bin/env python3
"""
Stage2 Layout Optimization using Mathematical Programming
Optimizes moving platform placement for tutorial effectiveness
"""

import numpy as np
from scipy.optimize import minimize
import json
from typing import List, Tuple, Dict

# Game Physics Constants
GRAVITY = 0.6
JUMP_FORCE = -12
MOVE_SPEED = 4
GAME_SPEED = 2.0

# Derived Constants
MAX_JUMP_HEIGHT = (JUMP_FORCE ** 2) / (2 * GRAVITY)  # 120px
MAX_JUMP_DISTANCE = 2 * abs(JUMP_FORCE) * MOVE_SPEED * GAME_SPEED / GRAVITY  # 320px
SAFE_JUMP_DISTANCE = MAX_JUMP_DISTANCE * 0.7  # 224px safety margin

class Stage2Optimizer:
    def __init__(self):
        self.stage_width = 2500
        self.base_y = 500
        self.min_platform_width = 60
        self.long_transport_min = 400  # Minimum long transport distance

    def calculate_jump_distance(self, x1: float, y1: float, x2: float, y2: float) -> float:
        """Calculate required jump distance between two platforms"""
        horizontal = abs(x2 - x1)
        vertical = max(0, y2 - y1)  # Only account for upward jumps
        
        # If jumping up, need extra horizontal distance
        if vertical > 0:
            # Time to reach target height: t = sqrt(2*h/g)
            time_factor = np.sqrt(2 * vertical / GRAVITY) if vertical > 0 else 1
            return horizontal / time_factor
        return horizontal

    def create_platform_sequence(self, params: np.ndarray) -> List[Dict]:
        """Create platform sequence from optimization parameters"""
        # Parameters: [x_positions, y_positions, moving_platform_configs]
        n_platforms = 6
        n_moving = 3
        
        # Fixed platforms
        platforms = []
        moving_platforms = []
        
        # Start platform (fixed)
        platforms.append({"x1": -500, "y1": 500, "x2": 300, "y2": 500})
        
        # Extract platform positions
        x_positions = params[:n_platforms]
        y_positions = params[n_platforms:2*n_platforms]
        
        # Sort platforms by x position
        sorted_indices = np.argsort(x_positions)
        
        for i, idx in enumerate(sorted_indices):
            x = x_positions[idx]
            y = y_positions[idx]
            width = 100  # Standard platform width
            
            platforms.append({
                "x1": x, "y1": y, "x2": x + width, "y2": y
            })
        
        # Moving platforms configuration
        moving_configs = params[2*n_platforms:].reshape(n_moving, 4)
        for i, config in enumerate(moving_configs):
            x_start, x_end, y, speed = config
            width = 80
            
            moving_platforms.append({
                "x1": x_start, "y1": y, "x2": x_start + width, "y2": y,
                "startX": x_start, "endX": x_end, "speed": speed, "direction": 1
            })
        
        return platforms, moving_platforms

    def objective_function(self, params: np.ndarray) -> float:
        """Objective function to minimize (negative of score)"""
        try:
            platforms, moving_platforms = self.create_platform_sequence(params)
            
            # Calculate scores
            clearability_score = self.calculate_clearability_score(platforms, moving_platforms)
            educational_score = self.calculate_educational_score(moving_platforms)
            variety_score = self.calculate_variety_score(platforms, moving_platforms)
            
            # Weighted combination
            total_score = (0.5 * clearability_score + 
                          0.3 * educational_score + 
                          0.2 * variety_score)
            
            return -total_score  # Minimize negative score = maximize score
            
        except Exception:
            return 1000  # High penalty for invalid configurations

    def calculate_clearability_score(self, platforms: List[Dict], moving_platforms: List[Dict]) -> float:
        """Calculate how clearable the stage is"""
        score = 0
        all_platforms = platforms + moving_platforms
        
        for i in range(len(all_platforms) - 1):
            p1 = all_platforms[i]
            p2 = all_platforms[i + 1]
            
            # Calculate jump distance
            distance = self.calculate_jump_distance(p1["x2"], p1["y1"], p2["x1"], p2["y1"])
            
            if distance <= SAFE_JUMP_DISTANCE:
                score += 100  # Clearable jump
            elif distance <= MAX_JUMP_DISTANCE:
                score += 50   # Difficult but possible
            else:
                score -= 200  # Impossible jump
        
        return score

    def calculate_educational_score(self, moving_platforms: List[Dict]) -> float:
        """Calculate educational value of moving platform arrangement"""
        score = 0
        
        for platform in moving_platforms:
            travel_distance = abs(platform["endX"] - platform["startX"])
            
            # Reward long transport sections
            if travel_distance >= self.long_transport_min:
                score += 100
            
            # Reward variety in speeds
            if 0.5 <= platform["speed"] <= 1.5:
                score += 50
            
        return score

    def calculate_variety_score(self, platforms: List[Dict], moving_platforms: List[Dict]) -> float:
        """Calculate variety and interest of the layout"""
        score = 0
        
        # Y-position variety
        y_positions = [p["y1"] for p in platforms + moving_platforms]
        y_variance = np.var(y_positions)
        score += min(y_variance / 100, 50)  # Cap at 50 points
        
        # Speed variety in moving platforms
        speeds = [p["speed"] for p in moving_platforms]
        speed_variance = np.var(speeds)
        score += min(speed_variance * 100, 30)  # Cap at 30 points
        
        return score

    def optimize(self) -> Dict:
        """Run the optimization"""
        # Initial guess: reasonable platform positions
        n_platforms = 6
        n_moving = 3
        
        # Initial positions spread across stage
        x_init = np.linspace(400, 2200, n_platforms)
        y_init = np.full(n_platforms, 500)  # Start at base level
        
        # Moving platform configs: [x_start, x_end, y, speed]
        moving_init = np.array([
            [350, 450, 480, 0.8],   # Short tutorial
            [800, 1400, 500, 0.6],  # Long transport
            [1800, 1950, 400, 1.0]  # Final challenge
        ]).flatten()
        
        x0 = np.concatenate([x_init, y_init, moving_init])
        
        # Bounds
        bounds = []
        # Platform x positions
        for i in range(n_platforms):
            bounds.append((300, 2300))
        # Platform y positions  
        for i in range(n_platforms):
            bounds.append((300, 550))
        # Moving platform configs
        for i in range(n_moving):
            bounds.extend([(200, 2000), (400, 2200), (300, 550), (0.3, 1.5)])
        
        # Constraints
        constraints = []
        
        # Constraint: platforms must be in order
        for i in range(n_platforms - 1):
            constraints.append({
                'type': 'ineq',
                'fun': lambda x, i=i: x[i+1] - x[i] - 100  # Minimum separation
            })
        
        # Constraint: moving platforms startX < endX
        for i in range(n_moving):
            start_idx = 2*n_platforms + i*4
            end_idx = start_idx + 1
            constraints.append({
                'type': 'ineq', 
                'fun': lambda x, s=start_idx, e=end_idx: x[e] - x[s] - 50
            })
        
        # Run optimization
        result = minimize(
            self.objective_function,
            x0,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints,
            options={'maxiter': 1000, 'ftol': 1e-6}
        )
        
        if result.success:
            platforms, moving_platforms = self.create_platform_sequence(result.x)
            return {
                'success': True,
                'platforms': platforms,
                'moving_platforms': moving_platforms,
                'score': -result.fun,
                'message': 'Optimization successful'
            }
        else:
            return {
                'success': False,
                'message': f'Optimization failed: {result.message}'
            }

if __name__ == "__main__":
    optimizer = Stage2Optimizer()
    result = optimizer.optimize()
    
    print("🎯 Stage2 Mathematical Optimization Results")
    print("=" * 50)
    
    if result['success']:
        print(f"✅ Optimization Score: {result['score']:.2f}")
        print(f"📊 Generated {len(result['platforms'])} fixed platforms")
        print(f"🔄 Generated {len(result['moving_platforms'])} moving platforms")
        
        # Display results
        print("\n📋 Fixed Platforms:")
        for i, p in enumerate(result['platforms']):
            print(f"  {i+1}: x={p['x1']:.0f}-{p['x2']:.0f}, y={p['y1']:.0f}")
        
        print("\n🔄 Moving Platforms:")
        for i, p in enumerate(result['moving_platforms']):
            travel = abs(p['endX'] - p['startX'])
            print(f"  {i+1}: x={p['startX']:.0f}→{p['endX']:.0f} (travel:{travel:.0f}px), y={p['y1']:.0f}, speed={p['speed']:.1f}")
        
        # Save optimized configuration
        config = {
            "id": 2,
            "name": "Stage 2",
            "description": "Moving Platform Tutorial - Mathematically Optimized!",
            "platforms": result['platforms'][1:],  # Skip start platform
            "movingPlatforms": result['moving_platforms'],
            "holes": [],  # Will be calculated based on gaps
            "spikes": [],
            "movingSpikes": [],
            "goal": {"x": 2400, "y": 400, "width": 40, "height": 50},
            "startText": {"x": 50, "y": 450, "text": "STAGE 2"},
            "goalText": {"x": 2420, "y": 380, "text": "GOAL"},
            "leftEdgeMessage": {"x": -400, "y": 450, "text": "OPTIMIZED TUTORIAL!"},
            "leftEdgeSubMessage": {"x": -400, "y": 470, "text": "MATH-POWERED PLATFORMS →"}
        }
        
        with open('optimized_stage2.json', 'w') as f:
            json.dump(config, f, indent=2)
        
        print("\n💾 Optimized configuration saved to 'optimized_stage2.json'")
        
    else:
        print(f"❌ Optimization failed: {result['message']}")