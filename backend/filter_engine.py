import sys
import json
import os
from datetime import datetime

def parse_date(date_str):
    if not date_str:
        return None
    try:
        # Standard format YYYY-MM-DD
        return datetime.strptime(date_str[:10], "%Y-%m-%d")
    except Exception:
        try:
            # Try parsing with timezone / generic
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except Exception:
            return None

def apply_filters_and_sort(raw_data, filter_state):
    if not raw_data:
        return []

    data = list(raw_data)
    headers = list(raw_data[0].keys()) if len(raw_data) > 0 else []

    # 1. Global Filter
    global_filter = filter_state.get("globalFilter", {})
    global_col = global_filter.get("column")
    global_val = global_filter.get("value")
    global_start = global_filter.get("startDate")
    global_end = global_filter.get("endDate")

    if global_col and global_val:
        data = [
            row for row in data 
            if str(row.get(global_col, "")) == str(global_val)
        ]

    if global_start or global_end:
        # Find date column
        date_col = None
        for h in headers:
            if "date" in h.lower() or "tarikh" in h.lower():
                date_col = h
                break
        if not date_col and headers:
            date_col = headers[0]

        if date_col:
            start_dt = parse_date(global_start)
            end_dt = parse_date(global_end)

            filtered_by_global_date = []
            for row in data:
                val = row.get(date_col)
                if not val:
                    continue
                row_dt = parse_date(str(val))
                if not row_dt:
                    continue
                
                start_valid = not start_dt or row_dt >= start_dt
                end_valid = not end_dt or row_dt <= end_dt
                if start_valid and end_valid:
                    filtered_by_global_date.append(row)
            data = filtered_by_global_date

    # 2. Sidebar Filters Active Check
    text_filter = filter_state.get("textFilter", {})
    t_col = text_filter.get("column")
    t_val = text_filter.get("value", "")
    t_op = text_filter.get("operator", "includes")
    is_text_active = bool(t_col and t_val)

    multi_filter = filter_state.get("multiSelect", {})
    m_col = multi_filter.get("column")
    m_sel = multi_filter.get("selectedValues", [])
    is_multi_active = bool(m_col and len(m_sel) > 0)

    num_filter = filter_state.get("numericRange", {})
    n_col = num_filter.get("column")
    n_min = num_filter.get("min")
    n_max = num_filter.get("max")
    
    # Parse float min/max
    try:
        f_min = float(n_min) if n_min is not None and str(n_min).strip() != "" else None
    except ValueError:
        f_min = None
    try:
        f_max = float(n_max) if n_max is not None and str(n_max).strip() != "" else None
    except ValueError:
        f_max = None
    is_numeric_active = bool(n_col and (f_min is not None or f_max is not None))

    date_filter = filter_state.get("dateRange", {})
    d_start = date_filter.get("start")
    d_end = date_filter.get("end")
    is_date_active = bool(d_start and d_end)

    match_mode = filter_state.get("matchMode", "AND")

    # Define test functions
    def test_text_filter(row):
        val = str(row.get(t_col, "")).lower()
        query = str(t_val).lower()
        if t_op == "startsWith":
            return val.startswith(query)
        elif t_op == "endsWith":
            return val.endswith(query)
        elif t_op == "equals":
            return val == query
        elif t_op == "doesNotInclude":
            return query not in val
        else: # includes
            return query in val

    def test_multi_filter(row):
        val = str(row.get(m_col, ""))
        return val in m_sel

    def test_numeric_filter(row):
        try:
            val = float(row.get(n_col))
        except (ValueError, TypeError):
            return False
        
        min_valid = f_min is None or val >= f_min
        max_valid = f_max is None or val <= f_max
        return min_valid and max_valid

    def test_date_filter(row):
        date_col = None
        for h in headers:
            if "date" in h.lower() or "tarikh" in h.lower():
                date_col = h
                break
        if not date_col and headers:
            date_col = headers[0]

        if not date_col:
            return False

        val = row.get(date_col)
        if not val:
            return False
        
        row_dt = parse_date(str(val))
        start_dt = parse_date(d_start)
        end_dt = parse_date(d_end)

        if not row_dt or not start_dt or not end_dt:
            return False

        return row_dt >= start_dt and row_dt <= end_dt

    # Assemble active filters
    active_tests = []
    if is_text_active:
        active_tests.append(test_text_filter)
    if is_multi_active:
        active_tests.append(test_multi_filter)
    if is_numeric_active:
        active_tests.append(test_numeric_filter)
    if is_date_active:
        active_tests.append(test_date_filter)

    # Apply Sidebar Filters
    if active_tests:
        filtered_data = []
        for row in data:
            if match_mode == "OR":
                # OR mode: any test matches
                matched = any(test(row) for test in active_tests)
            else:
                # AND mode: all tests match
                matched = all(test(row) for test in active_tests)
            
            if matched:
                filtered_data.append(row)
        data = filtered_data

    # 3. Group By
    group_by = filter_state.get("groupBy", {})
    group_cols = group_by.get("columns", [])
    if group_cols:
        grouped_map = {}
        for row in data:
            key = " - ".join(str(row.get(col, "")) for col in group_cols)
            if key not in grouped_map:
                # Initialize group structure
                grouped_map[key] = {
                    "count": 0,
                    "sums": {}
                }
                for h in headers:
                    if h not in group_cols:
                        try:
                            # Verify if any value can be float
                            float(row.get(h))
                            grouped_map[key]["sums"][h] = 0.0
                        except (ValueError, TypeError):
                            pass

            group = grouped_map[key]
            group["count"] += 1
            for h in list(group["sums"].keys()):
                try:
                    val = float(row.get(h, 0))
                    group["sums"][h] += val
                except (ValueError, TypeError):
                    pass

        # Build list of aggregated objects
        aggregated_data = []
        for key, value in grouped_map.items():
            obj = {}
            key_parts = key.split(" - ")
            for i, col in enumerate(group_cols):
                obj[col] = key_parts[i] if i < len(key_parts) else ""
            
            obj["कुल पंक्तियाँ"] = value["count"]
            for h, sum_val in value["sums"].items():
                obj[h] = sum_val
            
            aggregated_data.append(obj)
        data = aggregated_data
        # Refresh headers based on aggregated keys
        headers = list(data[0].keys()) if len(data) > 0 else []

    # 4. Multi-Column Sort
    sort_rules = filter_state.get("sortRules", [])
    if sort_rules:
        # Sort key generator function
        def get_sort_key(row):
            keys = []
            for rule in sort_rules:
                col = rule.get("column")
                order = rule.get("order", "asc")
                if not col:
                    continue
                
                val = row.get(col)
                # Try parsing as float for numeric sort
                try:
                    parsed_val = float(val)
                    # We wrap as a tuple of (type_indicator, value)
                    # type_indicator 0 for numeric, 1 for string
                    val_key = (0, parsed_val)
                except (ValueError, TypeError):
                    val_key = (1, str(val or "").lower())
                
                # In python sorting, to sort descending we can do custom comparisons
                # or reverse order after
                keys.append((order, val_key))
            return keys

        # Python's Timsort is stable. We can perform sequential sorts in reverse order of precedence
        for rule in reversed(sort_rules):
            col = rule.get("column")
            order = rule.get("order", "asc")
            if not col:
                continue

            def item_key(row):
                val = row.get(col)
                try:
                    return (0, float(val))
                except (ValueError, TypeError):
                    return (1, str(val or "").lower())

            data.sort(key=item_key, reverse=(order == "desc"))

    return data

def main():
    if len(sys.argv) < 4:
        print("Usage: python3 filter_engine.py <rawDataPath> <filterStatePath> <outputPath>", file=sys.stderr)
        sys.exit(1)

    raw_data_path = sys.argv[1]
    filter_state_path = sys.argv[2]
    output_path = sys.argv[3]

    try:
        # 1. Read input data
        if not os.path.exists(raw_data_path):
            print(f"Error: Raw data file {raw_data_path} not found.", file=sys.stderr)
            sys.exit(1)
        with open(raw_data_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        # 2. Read filter state
        if not os.path.exists(filter_state_path):
            print(f"Error: Filter state file {filter_state_path} not found.", file=sys.stderr)
            sys.exit(1)
        with open(filter_state_path, "r", encoding="utf-8") as f:
            filter_state = json.load(f)

        # 3. Apply filters & sorts
        result = apply_filters_and_sort(raw_data, filter_state)

        # 4. Write results
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print("Success")
    except Exception as e:
        print(f"Exception occurred in filter engine: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
