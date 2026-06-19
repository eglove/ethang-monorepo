import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

export const webstormMcpTableOfContents: MarkdownBlock[] = [
  {
    level: 2,
    text: "Table of Contents",
    type: "header"
  },
  {
    items: [
      {
        text: "[File Operations](#file-operations)\n- [`create_new_file`](#create_new_file)\n- [`get_all_open_file_paths`](#get_all_open_file_paths)\n- [`get_file_text_by_path`](#get_file_text_by_path)\n- [`list_directory_tree`](#list_directory_tree)\n- [`open_file_in_editor`](#open_file_in_editor)\n- [`read_file`](#read_file)\n- [`reformat_file`](#reformat_file)\n- [`replace_text_in_file`](#replace_text_in_file)"
      },
      {
        text: "[Search & Navigation](#search-navigation)\n- [`find_files_by_glob`](#find_files_by_glob)\n- [`find_files_by_name_keyword`](#find_files_by_name_keyword)\n- [`get_symbol_info`](#get_symbol_info)\n- [`search_file`](#search_file)\n- [`search_in_files_by_regex`](#search_in_files_by_regex)\n- [`search_in_files_by_text`](#search_in_files_by_text)\n- [`search_regex`](#search_regex)\n- [`search_symbol`](#search_symbol)\n- [`search_text`](#search_text)"
      },
      {
        text: "[Refactoring & Inspection](#refactoring-inspection)\n- [`generate_inspection_kts_api`](#generate_inspection_kts_api)\n- [`generate_inspection_kts_examples`](#generate_inspection_kts_examples)\n- [`generate_psi_tree`](#generate_psi_tree)\n- [`get_file_problems`](#get_file_problems)\n- [`rename_refactoring`](#rename_refactoring)\n- [`run_inspection_kts`](#run_inspection_kts)"
      },
      {
        text: "[Project & Build](#project-build)\n- [`build_project`](#build_project)\n- [`execute_run_configuration`](#execute_run_configuration)\n- [`execute_terminal_command`](#execute_terminal_command)\n- [`get_project_dependencies`](#get_project_dependencies)\n- [`get_project_modules`](#get_project_modules)\n- [`get_repositories`](#get_repositories)\n- [`get_run_configurations`](#get_run_configurations)"
      },
      {
        text: "[Database](#database)\n- [`cancel_sql_query`](#cancel_sql_query)\n- [`execute_sql_query`](#execute_sql_query)\n- [`get_database_object_description`](#get_database_object_description)\n- [`list_database_connections`](#list_database_connections)\n- [`list_database_schemas`](#list_database_schemas)\n- [`list_recent_sql_queries`](#list_recent_sql_queries)\n- [`list_schema_objects`](#list_schema_objects)\n- [`list_schema_object_kinds`](#list_schema_object_kinds)\n- [`preview_table_data`](#preview_table_data)\n- [`test_database_connection`](#test_database_connection)"
      }
    ],
    type: "unorderedList"
  }
];
