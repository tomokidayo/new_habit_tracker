class Auth::SessionsController < Devise::SessionsController
  respond_to :json
  skip_before_action :verify_signed_out_user, only: :destroy

  def destroy
    unless current_user
      render json: { error: "Unauthorized" }, status: :unauthorized
      return
    end
    super
  end

  private

  def respond_with(resource, _opts = {})
    render json: {
      user: {
        id: resource.id,
        name: resource.name,
        email: resource.email
      }
    }, status: :ok
  end

  def respond_to_on_destroy(non_navigational_status: :no_content)
    render json: { message: "Logged out successfully" }, status: :ok
  end
end
