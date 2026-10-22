# LandMap Core C — Build System
# ======================================================================
# Usage:
#   make              — Build debug binary (default)
#   make release      — Build optimized release binary
#   make test         — Run unit tests (CUnit)
#   make benchmark    — Run performance benchmarks
#   make valgrind     — Run memory check
#   make lint         — Static analysis (clang-tidy)
#   make clean        — Remove build artifacts

CC = gcc
CFLAGS = -Wall -Wextra -pedantic -std=c17 -fPIC -D_POSIX_C_SOURCE=200809L
LDFLAGS = -pthread -lm

# Debug vs Release flags
DEBUG_CFLAGS = $(CFLAGS) -g -O0 -DDEBUG
RELEASE_CFLAGS = $(CFLAGS) -O3 -DNDEBUG

# Directories
SRC_DIR = src
TEST_DIR = tests
BENCH_DIR = benchmarks
BUILD_DIR = build
INCLUDE_DIR = include

# Source files
BUFFER_SRCS = $(SRC_DIR)/buffer/ringbuffer.c $(SRC_DIR)/buffer/mempool.c
DATABASE_SRCS = $(SRC_DIR)/database/pool.c $(SRC_DIR)/database/query.c
WEBSOCKET_SRCS = $(SRC_DIR)/websocket/server.c $(SRC_DIR)/websocket/frame.c
GEO_SRCS = $(SRC_DIR)/geo/grid.c $(SRC_DIR)/geo/distance.c
TIMESERIES_SRCS = $(SRC_DIR)/timeseries/tseries.c
MAIN_SRCS = $(SRC_DIR)/main.c $(SRC_DIR)/log.c

# All C sources (excluding tests/benchmarks)
ALL_SRCS = $(BUFFER_SRCS) $(DATABASE_SRCS) $(WEBSOCKET_SRCS) $(GEO_SRCS) $(TIMESERIES_SRCS) $(MAIN_SRCS)

# Test sources
TEST_SRCS = $(TEST_DIR)/test_ringbuffer.c $(TEST_DIR)/test_mempool.c \
            $(TEST_DIR)/test_database_pool.c $(TEST_DIR)/test_main.c
TEST_OBJS = $(TEST_SRCS:.c=.o)

# Benchmark sources
BENCH_SRCS = $(BENCH_DIR)/bench_ringbuffer.c $(BENCH_DIR)/bench_websocket.c $(BENCH_DIR)/bench_main.c
BENCH_OBJS = $(BENCH_SRCS:.c=.o)

# Object files
OBJS = $(ALL_SRCS:.c=.o)
DEBUG_OBJS = $(OBJS:.o=.d.o)
RELEASE_OBJS = $(OBJS:.o=.r.o)

# Targets
DEBUG_TARGET = $(BUILD_DIR)/landmap-debug
RELEASE_TARGET = $(BUILD_DIR)/landmap
TEST_TARGET = $(BUILD_DIR)/test-runner
BENCH_TARGET = $(BUILD_DIR)/bench-runner

# Default target
.PHONY: all debug release test benchmark valgrind lint clean

all: debug

# ======================================================================
# DEBUG BUILD
# ======================================================================
debug: $(BUILD_DIR) $(DEBUG_TARGET)

$(DEBUG_TARGET): $(DEBUG_OBJS)
	$(CC) $(CFLAGS) -g -O0 -o $@ $^

%.d.o: %.c
	@mkdir -p $(@D)
	$(CC) $(DEBUG_CFLAGS) -I$(INCLUDE_DIR) -c -o $@ $<

# ======================================================================
# RELEASE BUILD
# ======================================================================
release: $(BUILD_DIR) $(RELEASE_TARGET)

$(RELEASE_TARGET): $(RELEASE_OBJS)
	$(CC) $(RELEASE_CFLAGS) -o $@ $^

%.r.o: %.c
	@mkdir -p $(@D)
	$(CC) $(RELEASE_CFLAGS) -I$(INCLUDE_DIR) -c -o $@ $<

# ======================================================================
# TESTING
# ======================================================================
test: $(BUILD_DIR) $(TEST_TARGET)
	@echo "======== Running Unit Tests ========"
	@./$(TEST_TARGET)

$(TEST_TARGET): $(DEBUG_OBJS) $(TEST_OBJS)
	$(CC) $(DEBUG_CFLAGS) -I$(INCLUDE_DIR) -o $@ $^ -lcunit

$(TEST_DIR)/%.o: $(TEST_DIR)/%.c
	@mkdir -p $(@D)
	$(CC) $(DEBUG_CFLAGS) -I$(INCLUDE_DIR) -c -o $@ $<

# ======================================================================
# BENCHMARKING
# ======================================================================
benchmark: $(BUILD_DIR) $(BENCH_TARGET)
	@echo "======== Running Benchmarks ========"
	@./$(BENCH_TARGET)

$(BENCH_TARGET): $(RELEASE_OBJS) $(BENCH_OBJS)
	$(CC) $(RELEASE_CFLAGS) -I$(INCLUDE_DIR) -o $@ $^ -ltime

$(BENCH_DIR)/%.o: $(BENCH_DIR)/%.c
	@mkdir -p $(@D)
	$(CC) $(RELEASE_CFLAGS) -I$(INCLUDE_DIR) -c -o $@ $<

# ======================================================================
# MEMORY CHECKING
# ======================================================================
valgrind: debug
	@echo "======== Running Valgrind (Memory Check) ========"
	valgrind --leak-check=full --show-leak-kinds=all \
	  --track-origins=yes --verbose \
	  --log-file=$(BUILD_DIR)/valgrind-out.txt \
	  ./$(DEBUG_TARGET)
	@cat $(BUILD_DIR)/valgrind-out.txt | grep -A5 "ERROR SUMMARY"

# ======================================================================
# STATIC ANALYSIS
# ======================================================================
lint:
	@echo "======== Running clang-tidy ========"
	@find $(SRC_DIR) -name "*.c" -exec clang-tidy {} -- -I$(INCLUDE_DIR) \;

# ======================================================================
# BUILD DIRECTORY
# ======================================================================
$(BUILD_DIR):
	@mkdir -p $(BUILD_DIR)

# ======================================================================
# CLEANUP
# ======================================================================
clean:
	@echo "Cleaning build artifacts..."
	rm -rf $(BUILD_DIR)
	find $(SRC_DIR) -name "*.o" -delete
	find $(SRC_DIR) -name "*.d.o" -delete
	find $(SRC_DIR) -name "*.r.o" -delete
	find $(TEST_DIR) -name "*.o" -delete
	find $(BENCH_DIR) -name "*.o" -delete
	@echo "Done!"

# ======================================================================
# HELP
# ======================================================================
help:
	@echo "LandMap Core C — Build System"
	@echo ""
	@echo "Targets:"
	@echo "  make debug        — Build debug binary (default)"
	@echo "  make release      — Build release binary"
	@echo "  make test         — Run unit tests"
	@echo "  make benchmark    — Run benchmarks"
	@echo "  make valgrind     — Memory check"
	@echo "  make lint         — Static analysis"
	@echo "  make clean        — Remove build artifacts"
	@echo "  make help         — Show this help"
	@echo ""
	@echo "Environment:"
	@echo "  CC=$(CC)"
	@echo "  CFLAGS=$(CFLAGS)"
