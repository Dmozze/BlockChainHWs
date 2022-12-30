#./program.sh --file <filename> --numbilets 20 --parameter 42

import argparse
import hashlib

parser = argparse.ArgumentParser(description='Process some integers.')

parser.add_argument('--file', dest='filename', required=True,
                    help='file to process')
parser.add_argument('--numbilets', dest='numbilets', type=int, required=True,
                    help='number of tickets')

parser.add_argument('--parameter', dest='parameter', type=int, required=True,
                    help='parameter')

def main():
    args = parser.parse_args()

    with open(args.filename) as f:
        for line in f:
            hash_line = line + " : " + str(args.parameter * args.numbilets)
            hash = hashlib.sha256(hash_line.encode('utf-8')).hexdigest()
            hash = int(hash, 16)
            print(line.strip(), hash % args.numbilets + 1)

if __name__ == "__main__":
    main()