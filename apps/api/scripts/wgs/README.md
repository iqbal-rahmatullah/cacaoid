# Genome-to-fingerprint (F1/F3)

Derives CacaoID registry genotypes (TcSNP IDs, Bekele et al. 2022 coding) for named clones from **public** genome
assemblies and WGS reads, by exact allele-specific 31-mer matching. No aligner, no reference index, no new deps.

| file | what |
|---|---|
| `kmerfp.py` | markers + k-mer table, streaming scanner, genotype caller, multi-locus mask, `demo` self-check |
| `fetch.py` | parallel HTTP range downloader (stdlib, atomic rename on success) |
| `pipeline.py` | per sample: download -> scan -> delete raw file; appends timings to `$WORK/runs.jsonl` |
| `report.py` | hits -> `data/wgs_refs/genotypes.tsv`, `provenance.json`, `kmer_mask.json`; concordance + coverage curve |

## Markers and allele coding

* Flanks: Allegre et al. 2012 *DNA Res* 19:23, Table S1 (1,536 EST-SNPs, 60 bp + `[X/Y]` + 60 bp), extracted once to
  `data/wgs_refs/tcsnp_flanks_allegre2012.tsv` (the .xls needs `xlrd`; it was converted in a throwaway venv).
  These are the GoldenGate SNPs Bekele et al. genotyped. The Zenodo record 22755806 (Ahn et al. 2026) does **not**
  contain TcSNP flanks (only 12 TcSNP1854-1865 IDs, no sequence).
* Bekele HapMap SNPs coded `A/C` are Illumina A/B calls (`A`=allele A, `C`=allele B); SNPs coded `*` are TOP-strand
  nucleotides. Strand: Illumina TOP/BOT rules (sequence walking for [A/T], [C/G]).
* Empirical correction: for [C/G] SNPs in A/B coding, Bekele's allele A is **G** (149/150 homozygous checks against
  three assemblies were flipped under the textbook rule). All other classes match the textbook rule.
* 834 of the 836 genotyped SNPs are usable (TcSNP906 is typed A/C in the HapMap but published as A/G).

## Calling

* k = 31, SNP at index 3..27 of the k-mer, both strands (~77k k-mers). A read or genome locus counts once per SNP
  (hits are de-duplicated on the genomic position of the SNP base).
* Mask (`kmer_mask`): a k-mer placed at >1 locus in >= 2 scanned assemblies is dropped for both alleles at that
  offset (masking one allele only would bias reads to the other); a SNP whose *same* allele still sits at >1 locus
  in >= 2 assemblies is dropped. One assembly alone is not trusted (duplicated haplotigs); requiring 2 kept ~40
  more calls per sample at equal concordance.
* Read calls with depth > 3x the sample's median marker depth are dropped (multi-copy loci, e.g. TcSNP456/1273).
* Duplicate assays (identical flank + alleles, e.g. TcSNP10 = TcSNP1401, TcSNP1028 = TcSNP1204) share k-mers.
* Reads: depth d = allele-A + allele-B reads, m = minor-allele reads. Homozygous if `m/d <= 0.10` and a het would
  give <= m minor reads with p < 0.01 under Binomial(d, 0.5) (so d >= 7 with m = 0, d >= 10 with m = 1);
  heterozygous if `m >= 2` and `m/d >= 0.20`; otherwise no call. Chosen on the two independent PBC 123 samples
  (cross-sample agreement 98.9% vs 98.2% for a plain depth>=8 / 10% / 25% rule, and ~50 more calls).
* Assemblies: a phased haplotype pair gives a diploid call; a single collapsed assembly is pseudo-haploid
  (heterozygous sites look homozygous), so it is validation-only.

## Run

```bash
cd backend
uv run python scripts/wgs/kmerfp.py demo                      # self-check
export WORK=/some/scratch/wgs_work                            # needs ~1 SRA object of free disk (2-5 GB)
uv run python scripts/wgs/pipeline.py assembly GCF_000208745.1 GCA_050656495.1 GCA_050656505.1
# reads: SRA object from AWS S3 + fastq-dump (sratoolkit tarball from
# https://ftp-trace.ncbi.nlm.nih.gov/sra/sdk/current/ , unpack anywhere, no install)
SRATOOLKIT=/path/sratoolkit.3.4.1-mac-arm64/bin uv run python scripts/wgs/pipeline.py sra SRR7774164
# any other FASTQ/FASTA stream (e.g. ENA, which was 6-7x slower than S3 here):
gzip -dc x_1.fastq.gz | uv run python scripts/wgs/kmerfp.py scan - $WORK/hits/MYRUN.npz
uv run python scripts/wgs/kmerfp.py call $WORK/hits/MYRUN.npz --mask ../data/wgs_refs/kmer_mask.json   # TSV
uv run python scripts/wgs/report.py                           # writes data/wgs_refs/*
```

Edit `SAMPLES` in `report.py` to add a sample (name, project, run/assembly ids, kind, Bekele names for validation).
Run two `pipeline.py` queues side by side with `CONNS=4` each to overlap download and scan; keep total connections <= 8.

Measured on a laptop (Oct 2026): AWS S3 SRA objects 7-9.7 MB/s with 8 ranges; ENA 0.25 MB/s per connection,
~1.3 MB/s with 8; NCBI FTP 0.8-1.9 MB/s per file. Scan: ~20-40 s per assembly; for reads `fastq-dump` (~1 CPU) is
the bottleneck. See `tasks/feasibility/F1_F3_genome_to_fingerprint.md` for the numbers.
