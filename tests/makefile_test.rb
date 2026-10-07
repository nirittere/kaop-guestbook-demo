require "minitest/autorun"
require "open3"

class MakefileTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)

  def dry_run(target)
    output, error, status = Open3.capture3("make", "-n", target, chdir: ROOT)
    assert status.success?, "make #{target} failed: #{error}"
    output
  end

  def test_bootstrap_creates_named_cluster_and_loads_local_image
    output = dry_run("bootstrap")
    assert_includes output, "k3d cluster create kaop-demo"
    assert_includes output, "docker build -t kaop-guestbook-demo:local"
    assert_includes output, "k3d image import kaop-guestbook-demo:local -c kaop-demo"
  end

  def test_state_targets_apply_the_expected_overlays
    assert_includes dry_run("healthy"), "kubectl apply -k deploy/overlays/healthy"
    assert_includes dry_run("incident"), "kubectl apply -k deploy/overlays/incident"
    assert_includes dry_run("recover"), "kubectl apply -k deploy/overlays/healthy"
  end

  def test_verify_reports_endpoints_restarts_and_events
    output = dry_run("verify")
    assert_includes output, "kubectl -n kaop-demo get endpoints redis-master"
    assert_includes output, "kubectl -n kaop-demo get pods"
    assert_includes output, "kubectl -n kaop-demo get events"
  end
end

