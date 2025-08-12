#!/bin/bash
# DEBUG.md规范一致性验证脚本

echo "=== DEBUG.md规范一致性验证开始 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 验证功能
verify() {
    local test_name=$1
    local condition=$2
    if eval "$condition"; then
        echo -e "${GREEN}✅ $test_name${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name${NC}"
        return 1
    fi
}

# 1. 验证文件存在性
echo "🔍 验证文件存在性..."
verify "CREATE.md存在" "[ -f CREATE.md ]"
verify "DEBUG.md存在" "[ -f DEBUG.md ]"
verify "DEPLOY.md存在" "[ -f DEPLOY.md ]"
verify "DOCKER_CONFIG.md存在" "[ -f DOCKER_CONFIG.md ]"

# 2. 验证agent文件完整性
echo "🔍 验证agent文件完整性..."
AGENT_FILES=(
    ".claude/agents/debug-orchestrator.md"
    ".claude/agents/environment-validator.md"
    ".claude/agents/project-architect.md"
    ".claude/agents/debug-spec-standard.md"
)

for file in "${AGENT_FILES[@]}"; do
    verify "Agent文件 $file 存在" "[ -f $file ]"
done

# 3. 验证DEBUG.md规范引用
verify "debug-orchestrator引用DEBUG.md" "grep -q 'DEBUG.md规范' .claude/agents/debug-orchestrator.md"
verify "environment-validator引用DEBUG.md" "grep -q 'DEBUG.md规范' .claude/agents/environment-validator.md"
verify "project-architect引用DEBUG.md" "grep -q 'DEBUG.md规范' .claude/agents/project-architect.md"

# 4. 验证功能标识符定义
echo "🔍 验证功能标识符定义..."
FUNCTIONS=("env-validation" "import-testing" "dataset-validation" "model-validation" "training-test" "result-verification" "docker-validation")

for func in "${FUNCTIONS[@]}"; do
    verify "功能标识符 $func 已定义" "grep -q '$func' .claude/agents/debug-spec-standard.md"
done

# 5. 验证规格追踪链
verify "CREATE→DEBUG→DEPLOY链完整性" "grep -q 'CREATE.md.*DEBUG.md.*DEPLOY.md' .claude/agents/project-architect.md"

# 6. 验证agent间接口一致性
verify "debug-orchestrator接口一致性" "grep -q 'DebugSpecInterface' .claude/agents/debug-orchestrator.md"
verify "environment-validator接口一致性" "grep -q 'DEBUG.md规范' .claude/agents/environment-validator.md"

# 7. 验证强制审计机制
verify "强制审计机制存在" "grep -q 'DEBUG.md规范审计' .claude/agents/debug-orchestrator.md"
verify "强制审计机制存在" "grep -q 'DEBUG.md强制规范审计' .claude/agents/environment-validator.md"

# 8. 验证无行号依赖
echo "🔍 验证无行号依赖..."
verify "无行号引用" "! grep -q 'DEBUG.md:[0-9]' .claude/agents/*.md"
verify "功能标识符使用" "grep -q '功能标识' .claude/agents/*.md"

# 9. 验证统一接口定义
verify "统一接口定义存在" "grep -q 'class DebugSpecInterface' .claude/agents/debug-spec-standard.md"
verify "统一命令格式" "grep -q 'execute-debug-spec' .claude/agents/debug-spec-standard.md"

# 10. 验证质量保证检查清单
echo "🔍 验证质量保证检查清单..."
verify "质量保证清单存在" "grep -q 'DEBUG.md规范质量检查' .claude/agents/*.md"

# 统计结果
PASSED=$(grep -c "✅" /tmp/validation_output 2>/dev/null || echo 0)
FAILED=$(grep -c "❌" /tmp/validation_output 2>/dev/null || echo 0)
TOTAL=$((PASSED + FAILED))

echo ""
echo "=== DEBUG.md规范一致性验证结果 ==="
echo -e "${GREEN}✅ 通过: $PASSED${NC}"
echo -e "${RED}❌ 失败: $FAILED${NC}"
echo "总计: $TOTAL"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有DEBUG.md规范一致性检查通过！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  存在 $FAILED 项不一致，请检查上述错误${NC}"
    exit 1
fi