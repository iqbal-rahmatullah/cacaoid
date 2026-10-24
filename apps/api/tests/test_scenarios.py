"""T14 hard scenarios (tasks/GAPS.md G-20..G-25): real-world lab and field mishaps, each with the behaviour we want."""
import csv
import io

import openpyxl
import pytest

from cacaoid.engine.simulate import load_world, write


@pytest.fixture(scope="module")
def files(client, tmp_path_factory):  # client fixture seeds the test database
    field, lab, key = write(tmp_path_factory.mktemp("sim"), *load_world())
    return field.read_text(), lab.read_text(), {r["sample_id"]: r for r in csv.DictReader(key.open())}


def run(client, field_text, lab_bytes, lab_name="lab.csv"):
    r = client.post("/api/batches", data={"name": "skenario"}, files={"field": ("f.csv", field_text.encode())})
    assert r.status_code == 201, r.json()
    bid = r.json()["id"]
    q = client.post(f"/api/batches/{bid}/lab", files={"lab": (lab_name, lab_bytes)})
    if q.status_code != 200:
        return bid, q, None
    out = client.post(f"/api/batches/{bid}/analyze").json()
    return bid, q, out


def wrong(client, bid, key):
    got = {x["sample_id"]: x for x in client.get(f"/api/batches/{bid}").json()["samples"]}
    return [s for s, k in key.items() if s in got and k["kategori"] not in ("kontrol", "bibit hibrida")
            and got[s]["verdict"] != k["vonis_harapan"]]


def test_semicolon_csv_from_excel(client, files):
    field, lab, key = files
    bid, q, out = run(client, field.replace(",", ";"), lab.replace(",", ";").encode())
    assert q.status_code == 200 and not wrong(client, bid, key)


def test_xlsx_lab_file(client, files):
    field, lab, key = files
    wb = openpyxl.Workbook()
    for row in csv.reader(io.StringIO(lab)):
        wb.active.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    bid, q, out = run(client, field, buf.getvalue(), "hasil_lab.xlsx")
    assert q.status_code == 200 and not wrong(client, bid, key)


def test_lab_rewrote_sample_ids(client, files):
    field, lab, key = files
    bid, q, out = run(client, field, lab.replace("SIM-0", "sim-").encode())  # SIM-001 -> sim-01
    assert q.status_code == 200 and not q.json()["unknown_ids"] and not wrong(client, bid, key)
    assert any("dicocokkan" in w for w in q.json()["warnings"])


def test_strand_flip_is_corrected(client, files):
    field, lab, key = files
    comp = str.maketrans("ACGT", "TGCA")
    rows = list(csv.reader(io.StringIO(lab)))
    # lab reports the opposite strand for 6 SNPs
    flipped = [rows[0]] + [[v.translate(comp) if 1 <= j <= 6 and ":" in v else v for j, v in enumerate(r)] for r in rows[1:]]
    text = "\n".join(",".join(r) for r in flipped)
    bid, q, out = run(client, field, text.encode())
    assert any("untai" in w for w in q.json()["warnings"])
    assert len(wrong(client, bid, key)) <= 2  # palindromic A/T or C/G SNPs can't be fixed, only flagged


def test_plate_shift_is_flagged(client, files):
    field, lab, key = files
    rows = lab.strip().split("\n")
    ids, data = [r.split(",", 1)[0] for r in rows[1:]], [r.split(",", 1)[1] for r in rows[1:]]
    shifted = [f"{ids[i]},{data[i + 1] if i < 40 else data[i]}" for i in range(len(ids))]  # one well off for 40 samples
    bid, q, out = run(client, field, ("\n".join([rows[0]] + shifted)).encode())
    assert out["qc"].get("plate_shift"), "a one-well slide must be reported before anyone acts on the verdicts"


def test_lab_sent_partial_panel(client, files):
    field, lab, key = files
    rows = [r.split(",") for r in lab.strip().split("\n")]
    few = "\n".join(",".join(r[:31]) for r in rows)  # 30 of 48 panel SNPs
    bid, q, out = run(client, field, few.encode())
    assert q.status_code == 400 and "30 dari 48" in q.json()["detail"]
    most = "\n".join(",".join(r[:46]) for r in rows)  # 45 of 48: still enough, judged on what was sent
    bid, q, out = run(client, field, most.encode())
    assert q.status_code == 200 and len(wrong(client, bid, key)) <= 1
