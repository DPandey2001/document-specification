import os
import json
import pdfplumber
import argparse
from pathlib import Path
from scraper import parse_datasheets

def process_single_file(file_path, output_dir):
    """
    Process a single PDF file and save the output.
    """
    file_contents = {}
    
    print(f"Reading file: {file_path.name}")
    try:
        with pdfplumber.open(file_path) as pdf:
            full_text = "".join(page.extract_text() + "\n--- PAGE BREAK ---\n" for page in pdf.pages)
            file_contents[file_path.name] = full_text
    except Exception as e:
        print(f"--> Failed to read {file_path.name}. Error: {e}")
        return False

    if not file_contents:
        print("Could not extract text from the PDF file. Exiting.")
        return False

    print("\nProcessing extracted text...")
    all_cables_data = parse_datasheets(file_contents)

    if not all_cables_data:
        print("No cable data was extracted from the file.")
        return False

    print(f"\n--- Saving {len(all_cables_data)} JSON Files ---")
    
    for cable in all_cables_data:
        original_filename = Path(cable['datasheetURL']).stem
        fiber_count = cable['fiberCount']
        
        output_filename = f"{original_filename}_{fiber_count}F.json"
        output_path = output_dir / output_filename

        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(cable, f, indent=2)
            print(f"Saved: {output_path.name}")
        except Exception as e:
            print(f"--> Failed to write {output_filename}. Error: {e}")

    return True

def process_directory(data_dir, output_dir):
    """
    Process all PDF files in the specified directory.
    """
    file_contents = {}
    pdf_files = list(data_dir.glob("*.pdf"))

    if not pdf_files:
        print(f"No PDF files found in '{data_dir}'.")
        return False

    print("--- Starting PDF Scraping Process ---")
    
    for pdf_path in pdf_files:
        print(f"Reading file: {pdf_path.name}")
        try:
            with pdfplumber.open(pdf_path) as pdf:
                full_text = "".join(page.extract_text() + "\n--- PAGE BREAK ---\n" for page in pdf.pages)
                file_contents[pdf_path.name] = full_text
        except Exception as e:
            print(f"--> Failed to read {pdf_path.name}. Error: {e}")

    if not file_contents:
        print("Could not extract text from any PDF files. Exiting.")
        return False

    print("\nProcessing extracted text...")
    all_cables_data = parse_datasheets(file_contents)

    if not all_cables_data:
        print("No cable data was extracted. Exiting.")
        return False

    print(f"\n--- Saving {len(all_cables_data)} JSON Files ---")
    
    for cable in all_cables_data:
        original_filename = Path(cable['datasheetURL']).stem
        fiber_count = cable['fiberCount']
        
        output_filename = f"{original_filename}_{fiber_count}F.json"
        output_path = output_dir / output_filename

        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(cable, f, indent=2)
            print(f"Saved: {output_path.name}")
        except Exception as e:
            print(f"--> Failed to write {output_filename}. Error: {e}")

    return True

def main():
    """
    Entry point of the script. Can process either a single file or all files in data directory.
    """
    parser = argparse.ArgumentParser(description='Process PDF datasheets and extract cable specifications.')
    parser.add_argument('--input-file', type=str, help='Path to a specific PDF file to process')
    args = parser.parse_args()

    project_root = Path(__file__).parent.parent
    output_dir = project_root / "scraper/output"
    output_dir.mkdir(exist_ok=True)

    success = False

    if args.input_file:
        # Process single file
        input_path = Path(args.input_file)
        if not input_path.exists():
            print(f"Error: Input file not found at '{input_path}'")
            return 1
        
        if input_path.suffix.lower() != '.pdf':
            print(f"Error: Input file must be a PDF file. Got: {input_path.suffix}")
            return 1
        
        success = process_single_file(input_path, output_dir)
    else:
        # Process all files in data directory (original behavior)
        data_dir = project_root / "scraper/data"
        
        if not data_dir.is_dir():
            print(f"Error: Input directory not found at '{data_dir}'")
            return 1
        
        success = process_directory(data_dir, output_dir)

    if success:
        print("\n--- Success! ---")
        print(f"All files saved in: {output_dir}")
        return 0
    else:
        print("\n--- Processing failed ---")
        return 1

if __name__ == "__main__":
    exit(main())
