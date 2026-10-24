from cacaoid.config import DATA
from cacaoid.engine.io import norm_call, parse_colombia_table4, parse_hapmap, parse_kasp_csv
from cacaoid.engine.qc import run_qc


def test_norm_call():
    assert norm_call("A:G") == norm_call("G A") == norm_call("ga") == "AG"
    assert norm_call("0 0") is None and norm_call("NN") is None and norm_call("?") is None
    assert norm_call("AX") is None and norm_call(None) is None


def test_parse_bekele_hapmap():
    g = parse_hapmap(DATA / "bekele2022" / "genotypes_hapmap.txt")
    assert len(g.samples) == 644 and len(g.snps) > 1000
    assert len(g.calls) == 644 and len(g.calls[0]) == len(g.snps)


def test_parse_colombia():
    g, banks = parse_colombia_table4(DATA / "osorio2025" / "table4_genotypes.xlsx")
    assert len(g.samples) == 4653 and len(g.snps) == 77 and set(banks) >= {"Palmira", "La Suiza"}


def test_kasp_csv_and_qc():
    text = "sample_id,S1,S2,S3,S4\nT1,A:G,G:G,C T,A A\nT2,A:G,?,,\nKTRL,A:G,G:G,C:T,A:A\n"
    g = parse_kasp_csv(text)
    assert g.calls[0] == ["AG", "GG", "CT", "AA"] and g.calls[1][1:] == [None, None, None]
    rep = run_qc(g, ["S1", "S2", "S3", "S4", "S5"], expected_ids=["T1", "T2", "T9"])
    # panel has 5 SNPs and S5 is absent from the file: best possible call rate is 4/5 = 0.8, below MIN_CALL_RATE
    assert rep.call_rate["T1"] == 0.8 and rep.call_rate["T2"] == 0.2
    assert rep.retest == ["T1", "T2", "KTRL"]
    assert rep.unknown_ids == ["KTRL"] and rep.missing_ids == ["T9"] and rep.panel_snps_missing == ["S5"]


def test_mean_call_rate_leaves_out_the_empty_negative_control():
    from cacaoid.engine.qc import QCReport
    r = QCReport(call_rate={"A": 0.96, "B": 0.98, "KTRL-POS-ICS60": 0.97, "KTRL-NTC": 0.0}, retest=["KTRL-NTC"])
    assert r.mean_call_rate == 0.97  # an NTC is meant to be empty; averaging it in made a 2-sample plate look like 72%
