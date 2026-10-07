require "minitest/autorun"
require "open3"
require "yaml"

class ManifestTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)

  def render(overlay)
    output, error, status = Open3.capture3("kubectl", "kustomize", File.join(ROOT, "deploy", "overlays", overlay))
    assert status.success?, "kustomize failed: #{error}"
    YAML.load_stream(output).compact
  end

  def resource(documents, kind, name)
    documents.find { |doc| doc["kind"] == kind && doc.dig("metadata", "name") == name } ||
      flunk("missing #{kind}/#{name}")
  end

  def test_healthy_redis_service_selects_master_pods
    documents = render("healthy")
    service = resource(documents, "Service", "redis-master")
    deployment = resource(documents, "Deployment", "redis-master")

    selector = service.dig("spec", "selector")
    labels = deployment.dig("spec", "template", "metadata", "labels")

    assert selector.all? { |key, value| labels[key] == value }, "healthy service must select the Redis master pods"
  end

  def test_repair_overlay_restores_redis_service_endpoints
    documents = render("incident")
    service = resource(documents, "Service", "redis-master")
    deployment = resource(documents, "Deployment", "redis-master")

    selector = service.dig("spec", "selector")
    labels = deployment.dig("spec", "template", "metadata", "labels")

    assert selector.all? { |key, value| labels[key] == value }, "repair must restore a selector that matches the Redis pods"
  end

  def test_healthy_frontend_separates_liveness_and_readiness
    deployment = resource(render("healthy"), "Deployment", "guestbook")
    container = deployment.dig("spec", "template", "spec", "containers").first

    assert_equal "/livez", container.dig("livenessProbe", "httpGet", "path")
    assert_equal "/readyz", container.dig("readinessProbe", "httpGet", "path")
  end

  def test_repair_overlay_keeps_liveness_independent_from_redis
    deployment = resource(render("incident"), "Deployment", "guestbook")
    container = deployment.dig("spec", "template", "spec", "containers").first

    assert_equal "/livez", container.dig("livenessProbe", "httpGet", "path")
    assert_equal "/readyz", container.dig("readinessProbe", "httpGet", "path")
  end

  def test_kaop_role_is_namespace_scoped_read_only_and_excludes_secrets
    role = resource(render("healthy"), "Role", "kaop-investigator")
    verbs = role.fetch("rules").flat_map { |rule| rule.fetch("verbs") }.uniq
    resources = role.fetch("rules").flat_map { |rule| rule.fetch("resources") }.uniq

    assert_equal %w[get list watch], verbs.sort
    refute_includes resources, "secrets"
    assert_includes resources, "pods/log"
    assert_includes resources, "endpoints"
  end
end
